import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import * as borsh from "@coral-xyz/borsh";
import { SolanaEscrow } from "../target/types/solana_escrow";
import assert from "assert";

describe("solana-escrow", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolanaEscrow as Program<SolanaEscrow>;

  let serviceProvider: anchor.web3.Keypair;
  let client: anchor.web3.Keypair;
  let escrowAddress: anchor.web3.PublicKey;
  let bump: number;

  before(async () => {

    client = anchor.web3.Keypair.generate();
    serviceProvider = anchor.web3.Keypair.generate();

    const programId = new anchor.web3.PublicKey("B3G5V8XLTyXVpM8txNJgdezuCJZrVq4y4zD1aVzezEvw");
    [escrowAddress, bump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("solanatestescrow"), client.publicKey.toBuffer()],
      programId
    );

    await airdrop(provider.connection, client.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    const balance = await provider.connection.getBalance(client.publicKey);
    assert(balance >= 2 * anchor.web3.LAMPORTS_PER_SOL, "Airdrop failed");

    // @todo - Remove this
    console.log('SERVICE PROVIDER: ', serviceProvider.publicKey.toString())
    console.log('CLIENT: ', client.publicKey.toString())
  });

  it("Escrow initialized by client", async () => {

    const amount = 1 * anchor.web3.LAMPORTS_PER_SOL;

    await program.methods
      .initializeEscrow(new anchor.BN(amount))
      .accounts({
        client: client.publicKey,
      })
      .signers([client])
      .rpc();

    const escrowAccountData = await getEscrowAccountData(provider.connection, escrowAddress);

    assert(escrowAccountData.client.toString() == client.publicKey.toString(), "Escrow `client` is set wrong")
    assert(escrowAccountData.amount.toNumber() == amount, "Escrow `amount` is set wrong")

    // console.log('Escrow Account initialised: ', escrowAccountData);
  });

  it("Service provider accepts the service", async () => {

    await program.methods
      .acceptService()
      .accounts({
        escrow: escrowAddress,
        serviceProvider: serviceProvider.publicKey,
      })
      .signers([serviceProvider])
      .rpc();

    const escrowAccountData = await getEscrowAccountData(provider.connection, escrowAddress);

    assert(escrowAccountData.service_provider.toString() == serviceProvider.publicKey.toString(), "Escrow `service_provider` is set wrong")
  })

  it("Client approves escrow after recieving service", async () => {
    await program.methods
      .approveCompletion()
      .accounts({
        escrow: escrowAddress,
        client: client.publicKey,
      })
      .signers([client])
      .rpc();

    const escrowAccountData = await getEscrowAccountData(provider.connection, escrowAddress);
    assert(escrowAccountData.client_approved, "Client approval should complete")

  })

  it("Release the fund", async () => {

    console.log('Service provider Balance before: ', await getSOLBalance(provider.connection, serviceProvider.publicKey))

    const solBalanceBefore = await getSOLBalance(provider.connection, escrowAddress)

    await program.methods
      .releaseFund()
      .accounts({
        serviceProvider: serviceProvider.publicKey,
        escrow: escrowAddress
      })
      .signers([serviceProvider])
      .rpc();

    console.log('Service provider Balance After: ', await getSOLBalance(provider.connection, serviceProvider.publicKey))

    // const escrowAccountInfo = await provider.connection.getAccountInfo(escrowAddress);
    // const rentExemptBalance = await provider.connection.getMinimumBalanceForRentExemption((escrowAccountInfo as any).space);
    const escrowAccountData = await getEscrowAccountData(provider.connection, escrowAddress);
    assert(escrowAccountData.is_completed, "Escrow should be completed")
  });

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
  borsh.bool('is_completed'),
  borsh.u8('bump'),
]);

async function getEscrowAccountData(connection: any, escrowAccountPubKey: any) {
  const escrowAccountInfo = await connection.getAccountInfo(escrowAccountPubKey);
  const escrowAccountData = EscrowAccountSchema.decode(escrowAccountInfo.data)
  return escrowAccountData;
}

const getSOLBalance = async (connection: any, accountPubKey: any) => {
  const balance = await connection.getBalance(accountPubKey);
  return balance
}