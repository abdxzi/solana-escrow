
import {
    AnchorProvider,
    BN,
    Program,
    setProvider
} from '@coral-xyz/anchor'

import { WalletContextState } from '@solana/wallet-adapter-react/lib/types/useWallet';
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js'

import { SolanaEscrow } from 'contract/solana_escrow';
import idl from 'contract/solana_escrow.json';

const idl_string = JSON.stringify(idl);
const idl_object = JSON.parse(idl_string);
const programId = new PublicKey(idl.address);

const getProvider = (wallet: WalletContextState) => {
    const conn = new Connection(clusterApiUrl("devnet"), "confirmed");
    const provider = new AnchorProvider(conn, wallet, AnchorProvider.defaultOptions());
    setProvider(provider);
    return provider;
}

const createEscrow = async (wallet: WalletContextState, metadata_cid: string, amount: number) => {
    console.log(amount);
    try {
        const anchorProvider = getProvider(wallet);
        const program = new Program<SolanaEscrow>(idl_object, anchorProvider);

        await program.methods
            .initializeEscrow(new BN(amount))
            .accounts({
                client: anchorProvider.publicKey,
            })
            .rpc();
    } catch (error) {
        console.error(error);
    }
}

const getEscrows = async (wallet: WalletContextState, connection: Connection) => {
    try {
        const anchorProvider = getProvider(wallet);
        const program = new Program<SolanaEscrow>(idl_object, anchorProvider);

        const escrows = Promise.all((await connection.getProgramAccounts(programId)).map(async (account) => ({
            ...(await program.account.escrowAccount.fetch(account.pubkey)),
            pubKey: account.pubkey
        })));

        return escrows;
    } catch (error) {
        console.error(error);
    }
}

export {
    createEscrow,
    getEscrows,
    getProvider
}