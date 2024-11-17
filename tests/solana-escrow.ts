import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaEscrow } from "../target/types/solana_escrow";
import assert from "assert";

import { struct, u8, Layout } from "@solana/buffer-layout";
import { publicKey, u64 } from "@solana/buffer-layout-utils";

describe("solana-escrow", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolanaEscrow as Program<SolanaEscrow>;

  const client = anchor.web3.Keypair.generate();
  let escrowAccount: anchor.web3.Keypair;

  before(async () => {
    await airdrop(provider.connection, client.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    const balance = await provider.connection.getBalance(client.publicKey);
    assert(balance >= 2 * anchor.web3.LAMPORTS_PER_SOL, "Airdrop failed");
  });

  it("Is initialized!", async () => {

    escrowAccount = anchor.web3.Keypair.generate();
    const amount = 1 * anchor.web3.LAMPORTS_PER_SOL; // 1 SOL

    await program.methods
      .initializeEscrow(new anchor.BN(amount))
      .accounts({
        escrowAccount: escrowAccount.publicKey,
        initializer: client.publicKey,
      })
      .signers([client, escrowAccount])
      .rpc();

    const escrowAccountData = await program.account.escrowAccount.fetch(
      escrowAccount.publicKey
    );



    const accountInfo = await provider.connection.getAccountInfo(escrowAccount.publicKey);

    // // Check the escrow state
    // console.log("Initializer:", escrowAccountData.initializer.toBase58());
    // console.log("Amount:", escrowAccountData.amount);
    console.log("Accountinfo:", accountInfo.data);
  });
});





// ----------------------- HELPERS -----------------------
async function airdrop(connection: any, address: any, amount = 1000000000) {
  await connection.confirmTransaction(await connection.requestAirdrop(address, amount), "confirmed");
}

