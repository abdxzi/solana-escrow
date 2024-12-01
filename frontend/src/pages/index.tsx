import type { NextPage } from "next";
import Head from "next/head";
import {  EscrowView } from "../views";

const Home: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Solana Scaffold</title>
        <meta
          name="description"
          content="Solana Scaffold"
        />
      </Head>
      <EscrowView />
    </div>
  );
};

export default Home;
