
import {
    AnchorProvider,
    BN,
    Program,
    setProvider
} from '@coral-xyz/anchor'
import * as bs58 from "bs58";

import { WalletContextState } from '@solana/wallet-adapter-react/lib/types/useWallet';
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js'

import { SolanaEscrow } from 'contract/solana_escrow';
import idl from 'contract/solana_escrow.json';
import * as borsh from "@coral-xyz/borsh";

const idl_string = JSON.stringify(idl);
const idl_object = JSON.parse(idl_string);
const programId = new PublicKey(idl.address);

const EscrowAccountSchema = borsh.struct([
    borsh.array(borsh.u8(), 8, 'discriminator'), // Skip the first 8 bytes
    borsh.publicKey('client'),              // Public key for client
    borsh.publicKey('service_provider'),    // Public key for service provider
    borsh.u64('amount'),                    // u64 in Little-Endian format
    borsh.bool('client_approved'),          // Boolean fields
    borsh.bool('is_completed'),
    borsh.u8('bump'),
    borsh.vec(borsh.u8(), 'metadata')
]);

const getProvider = (wallet: WalletContextState) => {
    const conn = new Connection(clusterApiUrl("devnet"), "confirmed");
    const provider = new AnchorProvider(conn, wallet, AnchorProvider.defaultOptions());
    setProvider(provider);
    return provider;
}

const createEscrow = async (wallet: WalletContextState, metadata_cid: string, amount: number) => {
    try {
        const anchorProvider = getProvider(wallet);
        const program = new Program<SolanaEscrow>(idl_object, anchorProvider);

        await program.methods
            .initializeEscrow(new BN(amount), metadata_cid)
            .accounts({
                client: anchorProvider.publicKey,
            })
            .rpc();
    } catch (error) {
        console.error(error);
        alert("Error creating escrow");
    }
}

const AcceptEscrow = async (wallet: WalletContextState, escrowAccountPubKey: PublicKey) => {
    try {
        const anchorProvider = getProvider(wallet);
        const program = new Program<SolanaEscrow>(idl_object, anchorProvider);

        await program.methods
            .acceptService()
            .accounts({
                serviceProvider: anchorProvider.publicKey,
                escrow: escrowAccountPubKey
            })
            .rpc()

        alert("Escrow Accepted");
    } catch (error) {
        console.error(error);
        alert("Error accepting escrow");
    }
}

const ClientApprove = async (wallet: WalletContextState, escrowAccountPubKey: PublicKey) => {
    try {
        const anchorProvider = getProvider(wallet);
        const program = new Program<SolanaEscrow>(idl_object, anchorProvider);

        await program.methods
            .approveCompletion()
            .accounts({
                escrow: escrowAccountPubKey,
                client: anchorProvider.publicKey,
            })
            .rpc();

        alert("Escrow Approved");
    } catch (error) {
        console.error(error);
        alert("Error Approving escrow");
    }
}

const WithdrawEscrowAmount = async (wallet: WalletContextState, escrowAccountPubKey: PublicKey) => {
    try {
        const anchorProvider = getProvider(wallet);
        const program = new Program<SolanaEscrow>(idl_object, anchorProvider);

        await program.methods
            .releaseFund()
            .accounts({
                serviceProvider: anchorProvider.publicKey,
                escrow: escrowAccountPubKey
            })
            .rpc();

        alert("Escrow Amount Withdrawed");
    } catch (error) {
        console.error(error);
        alert("Error Withdrawing escrow amount");
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

const getEscrowAccountInfo = async (wallet: WalletContextState, connection: Connection, escrowAccountPubKey: PublicKey) => {
    const escrowAccountInfo = await connection.getAccountInfo(escrowAccountPubKey);
    const escrowAccountData = EscrowAccountSchema.decode(escrowAccountInfo.data)
    return escrowAccountData;
}

const metadataBytesToCID = (metadata: any) => {

    const metadataBytes = new Uint8Array(metadata);

    const decoder = new TextDecoder('utf-8');
    const cid = decoder.decode(metadataBytes);
    return cid
}

const isDefaultPublicKey = (address: PublicKey) => {
    return (address.toString() == '11111111111111111111111111111111') ? true : false;
}

const isSameAddress = (address1: PublicKey, address2: PublicKey) => {
    return (address1.toString() == address2.toString()) ? true : false;
}


export {
    createEscrow,
    getEscrows,
    getProvider,
    getEscrowAccountInfo,
    metadataBytesToCID,
    isDefaultPublicKey,
    isSameAddress,
    AcceptEscrow,
    ClientApprove,
    WithdrawEscrowAmount
}