import React, { use, useState } from 'react'

import { useConnection, useWallet } from '@solana/wallet-adapter-react'

import {
    Program,
    AnchorProvider,
    web3,
    utils,
    BN,
    setProvider
} from '@coral-xyz/anchor'

import idl from './contract/solana_escrow.json'
import { SolanaEscrow } from './contract/solana_escrow'
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js'

const idl_string = JSON.stringify(idl);
const idl_object = JSON.parse(idl_string);
const programId = new PublicKey(idl.address);

console.log(programId.toString());

export default function Escrow() {

    const wallet = useWallet();
    const { connection } = useConnection();

    const [escrowAmount, setEscrowAmount] = useState("");

    const getProvider = () => {
        const conn = new Connection(clusterApiUrl("devnet"), "confirmed");
        const provider = new AnchorProvider(conn, wallet, AnchorProvider.defaultOptions());
        setProvider(provider);
        return provider;
    }

    // const anchorProvider = getProvider();
    // const program = new Program<SolanaEscrow>(idl_object, anchorProvider);

    // console.log(program.programId.toString());

    const createEscrow = async (amount: number) => {
        console.log(amount);
        try {
            const anchorProvider = getProvider();
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

    const getEscrows = async () => {
        try {
            const anchorProvider = getProvider();
            const program = new Program<SolanaEscrow>(idl_object, anchorProvider);

            Promise.all((await connection.getProgramAccounts(programId)).map(async (account) => ({
                ...(await program.account.escrowAccount.fetch(account.pubkey)),
                pubKey: account.pubkey
            }))).then((escrows) => {
                console.log(escrows);
            })
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <div>
            <div className="flex gap-[20px]">
                <input className='text-black px-4 py-2 rounded' type="number" value={escrowAmount} onInput={(e) => { setEscrowAmount((e.target as HTMLInputElement).value) }} placeholder='Escrow Amount (SOL)' />
                <button className='bg-blue-600 px-4 py-2 rounded hover:bg-blue-400' onClick={() => createEscrow(Number(escrowAmount))}>Create Escrow</button>
            </div>
            <div className="flex">
                <button className='bg-blue-600 px-4 py-2 rounded hover:bg-blue-400' onClick={ () => { getEscrows() } }>Get Escrows</button>
            </div>
        </div>
    )
}
