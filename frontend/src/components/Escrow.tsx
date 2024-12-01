import { useWallet, WalletContextState } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { is } from 'immer/dist/internal';
import React from 'react'
import { AcceptEscrow, ClientApprove, isDefaultPublicKey, isSameAddress, WithdrawEscrowAmount } from 'utils/solana';

type Escrow = {
    client: PublicKey,
    service_provider: PublicKey,
    amount: number,
    client_approved: boolean,
    is_completed: boolean,
    bump: number,
    metadata: string,
    ipfs: {
        data: {
            title: string
            description: string
            amount: string
        }
    },
    pubKey: PublicKey
};

export default function Escrow({ escrow, onBackPress }: { escrow: Escrow, onBackPress: () => void }) {

    const isAccepted = !isDefaultPublicKey(escrow.service_provider);
    const wallet = useWallet();


    const acceptEscrow = async () => {
        await AcceptEscrow(wallet, escrow.pubKey);
    }

    const markAsComplete = async () => {
        ClientApprove(wallet, escrow.pubKey);
    }

    const releaseFund = async () => {
        WithdrawEscrowAmount(wallet, escrow.pubKey);
    }

    console.log("Escrow", escrow);

    return (
        <div className="flex flex-col w-full px-[20px] mt-[20px] mb-[200px]">
            <div className='cursor-pointer' onClick={onBackPress}>
                <svg
                    width="32px"
                    height="32px"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className='fill-current'
                >
                    <path
                        fillRule="evenodd"
                        d="M7.78 12.53a.75.75 0 01-1.06 0L2.47 8.28a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 1.06L4.81 7h7.44a.75.75 0 010 1.5H4.81l2.97 2.97a.75.75 0 010 1.06z"
                    />
                </svg>
            </div>
            <div className="flex flex-col mt-[20px] gap-6 w-full md:w-[60%]">
                <div className="text-3xl font-bold">
                    {escrow.ipfs.data.title}
                    {!isAccepted && <span className="text-lg font-medium text-green-500"> (Open)</span>}
                </div>
                <div className="text-lg font-medium">{escrow.ipfs.data.description}</div>
                <div className="text-lg font-medium">Amount: {escrow.amount.toString()} SOL</div>
                <div className="">
                    <div className="text-lg font-medium">Posted By: <span className="text-blue-400">{escrow.client.toString()}</span></div>
                    <div className="text-lg font-medium">Accepted By: {!isAccepted ? <span className='text-red-500'>None</span> : <span className="text-blue-400">{escrow.service_provider.toString()}</span>}</div>
                    <div className="text-lg font-medium">Status: {isAccepted ? <span className='text-blue-400'>Accepted</span> : <span className='text-green-500'>This escrow is open. You can accept this escrow.</span>}</div>
                </div>
                <div className="">
                    {
                        !isAccepted && !isSameAddress(wallet.publicKey, escrow.client) && (
                            <div className="bg-blue-400 font-bold px-6 py-3 rounded-[10px] w-fit cursor-pointer" onClick={acceptEscrow}>Accept this Escrow</div>
                        )
                    }
                    {
                        !isAccepted && isSameAddress(wallet.publicKey, escrow.client) && (
                            <span className='text-yellow-400'>When someone accepts your proposal, status will update</span>
                        )
                    }
                    {
                        !escrow.client_approved && isAccepted  && isSameAddress(wallet.publicKey, escrow.service_provider) && (
                            <span className='text-yellow-400'>You have accepted this escrow. Complete task and deliver. The Task provider will approve the escrow amount. You can only withdraw amount after that.</span>
                        )
                    }
                    {
                        !escrow.client_approved && isAccepted && isSameAddress(wallet.publicKey, escrow.client) && (
                            <div>
                                <span className='text-yellow-400'>Mark escrow as complete after recieving requested service. It will approve escrow amount withdrawal</span>
                                <div className="bg-blue-400 font-bold px-6 py-3 rounded-[10px] w-fit cursor-pointer mt-[20px]" onClick={markAsComplete}>Approve Escrow Withdrawal</div>
                            </div>
                        )
                    }
                    {
                        escrow.client_approved &&  isSameAddress(wallet.publicKey, escrow.client) && (
                            <span className='text-green-500'>Escrow amount approved. Service provider can withdraw now.</span>
                        )
                    }
                    {
                        escrow.client_approved &&  isSameAddress(wallet.publicKey, escrow.service_provider) && (
                            <div>
                                <span className='text-green-500'>Escrow amount approved. You can withdraw now.</span>
                                <div className="bg-green-500 font-bold px-6 py-3 rounded-[10px] w-fit cursor-pointer mt-[20px]" onClick={releaseFund}>Withdraw Escrow</div>
                            </div>
                        )
                    }
                </div>
            </div>
        </div>
    )
}