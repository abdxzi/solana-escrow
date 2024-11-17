import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import * as borsh from "@coral-xyz/borsh";
import { SolanaEscrow } from "../target/types/solana_escrow";
import assert from "assert";

describe("solana-escrow", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolanaEscrow as Program<SolanaEscrow>;

  const client = anchor.web3.Keypair.generate();
  console.log('CLIENT: ', client.publicKey.toString())
  let escrowAccount: anchor.web3.Keypair;
  let serviceProvider: anchor.web3.Keypair;

  before(async () => {
    await airdrop(provider.connection, client.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    const balance = await provider.connection.getBalance(client.publicKey);
    assert(balance >= 2 * anchor.web3.LAMPORTS_PER_SOL, "Airdrop failed");
  });

  it("Escrow initialized by client", async () => {

    escrowAccount = anchor.web3.Keypair.generate();
    const amount = 1 * anchor.web3.LAMPORTS_PER_SOL; // 1 SOL

    await program.methods
      .initializeEscrow(new anchor.BN(amount))
      .accounts({
        escrow: escrowAccount.publicKey,
        client: client.publicKey,
      })
      .signers([client, escrowAccount])
      .rpc();

    const escrowAccountData = await getEscrowAccountData(provider.connection, escrowAccount);

    assert(escrowAccountData.client.toString() == client.publicKey.toString(), "Escrow `client` is set wrong")
    assert(escrowAccountData.amount.toNumber() == amount, "Escrow `amount` is set wrong")

    // console.log('Escrow Account initialised: ', escrowAccountData);
  });

  it("Service provider accepts the service", async () => {

    serviceProvider = anchor.web3.Keypair.generate();

    console.log('SERVICE PROVIDER: ', serviceProvider.publicKey.toString())

    await program.methods
      .acceptService()
      .accounts({
        escrow: escrowAccount.publicKey,
        serviceProvider: serviceProvider.publicKey,
      })
      .signers([serviceProvider])
      .rpc();

    const escrowAccountData = await getEscrowAccountData(provider.connection, escrowAccount);

    assert(escrowAccountData.service_provider.toString() == serviceProvider.publicKey.toString(), "Escrow `service_provider` is set wrong")
  })

  it("Service Provider approves competion", async () => {
    await program.methods
      .approveCompletion() 
      .accounts({
        escrow: escrowAccount.publicKey,
        signer: serviceProvider.publicKey,
      })
      .signers([serviceProvider])
      .rpc();

      const escrowAccountData = await getEscrowAccountData(provider.connection, escrowAccount);
      assert(escrowAccountData.provider_approved, "Service provider did not approve completion")
  })

  it("Client approves, Transfers SOL, complete escrow", async () => {
    await program.methods
      .approveCompletion() 
      .accounts({
        escrow: escrowAccount.publicKey,
        signer: client.publicKey,
      })
      .signers([client])
      .rpc();

      const escrowAccountData = await getEscrowAccountData(provider.connection, escrowAccount);
      assert(escrowAccountData.is_completed, "Escrow should complete")
      assert(escrowAccountData.client_approved, "Client approval should complete")
  })
});





// ----------------------- HELPERS -----------------------
async function airdrop(connection: any, address: any, amount = 1000000000) {
  await connection.confirmTransaction(await connection.requestAirdrop(address, amount), "confirmed");
}

// Define the schema for decoding
const EscrowAccountSchema = borsh.struct([
  borsh.array(borsh.u8(), 8, 'discriminator'), // Skip the first 8 bytes
  borsh.publicKey('client'),              // Public key for client
  borsh.publicKey('service_provider'),    // Public key for service provider
  borsh.u64('amount'),                    // u64 in Little-Endian format
  borsh.bool('client_approved'),          // Boolean fields
  borsh.bool('provider_approved'),
  borsh.bool('is_completed'),
]);

async function getEscrowAccountData(connection: any, escrowAccount: any) {
  const escrowAccountInfo = await connection.getAccountInfo(escrowAccount.publicKey);
  const escrowAccountData = EscrowAccountSchema.decode(escrowAccountInfo.data)
  return escrowAccountData;
}