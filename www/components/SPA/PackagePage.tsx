import Head from "next/head";
import React from "react";
import { useParams } from "react-router-dom";

import Package from "@/components/Docs/Package";
import FetchPackage from "@/components/FetchPackage";
import Layout from "@/components/Layout";

export default function PackagePage() {
  const { pkg } = useParams();
  return (
    <>
      <Head>
        <title>py.wtf: {pkg}</title>
      </Head>
      <FetchPackage
        name={pkg as string}
        content={(pkg) => (
          <Layout pkg={pkg}>
            <Package pkg={pkg} />
          </Layout>
        )}
      />
    </>
  );
}
