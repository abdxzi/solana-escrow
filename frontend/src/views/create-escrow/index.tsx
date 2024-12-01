
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { FC, useState } from "react";
import { uploadJson } from "utils/ipfs";
import { createEscrow } from "utils/solana";

export const CreateView: FC = ({ }) => {

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const wallet = useWallet();
  const { connection } = useConnection();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const metadata = {
      title,
      description,
      amount
    }

    // Upload metadata to IPFS
    const ipfs = await uploadJson(JSON.stringify(metadata, null, 2), `${wallet.publicKey.toString()}.json`);
    const cid = ipfs.IpfsHash;

    await createEscrow(wallet, cid, Number(amount));
  }

  return (
    <div className="md:hero mx-auto p-4">
      <div className="md:hero-content flex flex-col">
        <h1 className="text-center text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mt-10 mb-8">
          Create Escrow
        </h1>
        <div className="text-center">
          {/* A form containg fields title, description, amount in sol, create button */}
          <form className="flex flex-col gap-4">
            <label className="text-lg font-bold">Title</label>
            <input className="input" type="text" placeholder="Title" />
            <label className="text-lg font-bold">Description</label>
            <textarea className="input" placeholder="Description" />
            <label className="text-lg font-bold">Amount (in SOL)</label>
            <input className="input" type="number" placeholder="Amount" />
            <button className="btn" onClick={handleSubmit}>Create Escrow</button>
          </form>
        </div>
      </div>
    </div>
  );
};
