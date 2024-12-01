
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

    try {
      // Upload metadata to IPFS
      const ipfs = await uploadJson(JSON.stringify(metadata, null, 2), `${wallet.publicKey.toString()}.json`);
      const cid = ipfs.IpfsHash;

      console.log("Metadata CID: ", cid);

      await createEscrow(wallet, cid, Number(amount));

      alert("Escrow created successfully!");
    } catch (error) {
      console.error(error);
      alert("Some Error Occured!");
    }
  }

  return (
    <div className="md:hero mx-auto p-4">
      <div className="md:hero-content flex flex-col md:min-w-[800px]">
        <h1 className="text-center text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mt-10 mb-8">
          Create Escrow
        </h1>
        <div className="text-center md:min-w-[50%]">
          {/* A form containg fields title, description, amount in sol, create button */}
          <form className="flex flex-col gap-4 items-start">
            <div className="flex flex-col w-full gap-2">
              <label className="text-left text-lg font-bold">Title</label>
              <input className="input" type="text" placeholder="Title" onInput={(e) => setTitle((e.target as HTMLInputElement).value)} />
            </div>
            <div className="flex flex-col w-full gap-2">
              <label className="text-left text-lg font-bold">Description</label>
              <textarea className="input min-h-[100px]" placeholder="Description" onInput={(e) => setDescription((e.target as HTMLTextAreaElement).value)} />
            </div>
            <div className="flex flex-col w-full gap-2">
              <label className="text-left text-lg font-bold">Amount (in SOL)</label>
              <input className="input" type="number" placeholder="Amount" onInput={(e) => setAmount((e.target as HTMLInputElement).value)} />
            </div>
            <button className="btn" onClick={handleSubmit}>Create Escrow</button>
          </form>
        </div>
      </div>
    </div>
  );
};
