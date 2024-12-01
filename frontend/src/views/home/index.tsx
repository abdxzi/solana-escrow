import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import Escrow from 'components/Escrow';
import React, { useEffect, useState } from 'react'
import { getMetadataFromIPFS } from 'utils/ipfs';
import { getEscrowAccountInfo, getEscrows, isDefaultPublicKey, metadataBytesToCID } from 'utils/solana';

export function EscrowView() {

    const wallet = useWallet();
    const { connection } = useConnection();

    const [escrows, setEscrows] = useState([]);
    const [currentEscrow, setCurrentEscrow] = useState(null);
    const [detailView, setDetailView] = useState(false);

    const fetchEscrows = async () => {
        const escrowAccounts = await getEscrows(wallet, connection);

        const escrowAccountDataPromises = escrowAccounts.map(async (escrow) => {
            return {
                ...(await getEscrowAccountInfo(wallet, connection, escrow.pubKey)),
                pubKey: escrow.pubKey
            }
        });

        const escrowAccountData = await Promise.all(escrowAccountDataPromises);

        const escrowsWithMetadataPromises = escrowAccountData.map(async (escrow) => {
            const cid = metadataBytesToCID(escrow.metadata);
            const metadata = await getMetadataFromIPFS(cid);
            return {
                ...escrow,
                ipfs: metadata
            }
        })

        const escrowsWithMetadata = await Promise.all(escrowsWithMetadataPromises);

        setEscrows(escrowsWithMetadata)
        setCurrentEscrow(escrowsWithMetadata[0])
    }

    // console.log(isDefaultPublicKey(escrows[0].service_provider));

    useEffect(() => {
        if (wallet.connected) {
            fetchEscrows();
        }

        console.log("Wallet", wallet);
    }, [wallet, connection]);

    return (

        <>
            {
                wallet.connected && !detailView && (
                    <div className='flex flex-col items-start px-2 md:px-12'>
                        {/* A list of escrows */}
                        <h1 className="text-center text-3xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mt-10 mb-8">
                            Escrow Works
                        </h1>

                        <div className="flex gap-5 flex-wrap">
                            {
                                escrows.map((escrow, i) => (
                                    <div className='flex flex-col rounded-2xl w-full sm:w-[400px] bg-[#141414] text-[#fff] shadow-xl px-5 py-6 cursor-pointer' key={i} onClick={() => {
                                        setCurrentEscrow(escrow);
                                        setDetailView(true);
                                    }}>
                                        <div className="text-[1.3rem] font-bold pr-1 pb-6">{escrow.ipfs.data.title}</div>
                                        <div className="text-lg">{escrow.ipfs.data.description.slice(0, 150)}...</div>
                                        <div className="flex flex-wrap gap-2">
                                            <div className="flex mt-2 px-4 py-2 bg-[#328bffe0] w-fit text-sm rounded-lg font-bold">{escrow.amount.toString()} SOL</div>
                                            {
                                                isDefaultPublicKey(escrow.service_provider) ? (
                                                    <div className="flex mt-2 px-4 py-2 bg-green-500 w-fit text-sm rounded-lg font-bold">Open</div>
                                                ) : (
                                                    <div className="flex mt-2 px-4 py-2 bg-[#328bff7c] w-fit text-sm rounded-lg font-bold">Accepted</div>
                                                )
                                            }
                                        </div>
                                    </div>
                                ))
                            }
                        </div>


                    </div>
                )
            }
            {
                wallet.connected && currentEscrow && detailView && (
                    <Escrow escrow={currentEscrow} onBackPress={() => setDetailView(false)} />
                )
            }
            {
                !wallet.connected && (
                    <>
                        Please connect wallet to view escrows
                    </>
                )
            }
        </>
    )
}