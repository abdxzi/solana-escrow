import { bytes } from '@coral-xyz/anchor/dist/cjs/utils';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import React, { useEffect, useState } from 'react'
import { getEscrows } from 'utils/solana';

export function EscrowView() {

    const wallet = useWallet();
    const { connection } = useConnection();

    const [escrows, setEscrows] = useState([]);

    const fetchEscrows = async () => {
        const escrows = await getEscrows(wallet, connection);
        console.log("Escrows", escrows.length);
        setEscrows(escrows);
    }

    useEffect(() => {
        if(wallet.connected) {
            fetchEscrows();
        }

        console.log("Wallet", wallet);
    }, [wallet, connection]);

    return (
        <div className='flex flex-col items-start px-12'>
            {/* A list of escrows */}
            <h1 className="text-center text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mt-10 mb-8">
                Escrows
            </h1>

            <div className="">
                {
                    escrows.map((escrow, i) => (
                        <div key={i}>
                            <h1>By: {escrow.pubKey.toString()}</h1>
                        </div>
                    ))
                }
            </div>

            {
                !wallet.connected && (
                    <>
                    Please connect wallet to view escrows
                    </>
                )
            }
        </div>
    )
}
