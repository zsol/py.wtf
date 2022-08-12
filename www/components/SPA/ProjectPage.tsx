import Head from "next/head";
import React from "react";
import { useParams } from "react-router-dom";

import Project from "@/components/Docs/Project";
import FetchProject from "@/components/FetchProject";
import Layout from "@/components/Layout";

export default function ProjectPage() {
  const { prj } = useParams();
  return (
    <>
      <Head>
        <title>py.wtf: {prj}</title>
      </Head>
      <FetchProject
        name={prj as string}
        content={(prj) => (
          <Layout project={prj}>
            <Project prj={prj} />
          </Layout>
        )}
      />
    </>
  );
}
