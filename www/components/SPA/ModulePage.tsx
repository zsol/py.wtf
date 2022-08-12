import Head from "next/head";
import React from "react";
import { useParams } from "react-router-dom";

import Module from "@/components/Docs/Module";
import FetchProject from "@/components/FetchProject";
import Layout from "@/components/Layout";
import ModuleList from "@/components/Sidebar/ModuleList";

export default function ModulePage() {
  const { prj: projectName, mod: modName } = useParams();
  return (
    <>
      <Head>
        <title>py.wtf: {modName}</title>
      </Head>
      <FetchProject
        name={projectName}
        content={(prj) => {
          const mod = prj.modules.find((mod) => mod.name === modName);
          return (
            <Layout
              project={prj}
              sidebar={<ModuleList prj={prj} currentModule={mod} />}
            >
              {mod ? (
                <Module prj={prj} mod={mod} />
              ) : (
                `Module "${modName || ""}" not found 🤪`
              )}
            </Layout>
          );
        }}
      />
    </>
  );
}
