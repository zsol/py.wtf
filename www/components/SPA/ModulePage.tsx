import Head from "next/head";
import React from "react";
import { useParams } from "react-router-dom";

import Module from "@/components/Docs/Module";
import FetchProject from "@/components/FetchProject";
import ModuleList from "@/components/Sidebar/ModuleList";

import Sidebar from "../Sidebar/Sidebar";
import ContentWithSidebar from "../core/layout/ContentWithSidebar";

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
            <ContentWithSidebar
              sidebar={
                <Sidebar project={prj}>
                  <ModuleList prj={prj} currentModule={mod} />
                </Sidebar>
              }
            >
              {mod ? (
                <Module prj={prj} mod={mod} />
              ) : (
                `Module "${modName || ""}" not found 🤪`
              )}
            </ContentWithSidebar>
          );
        }}
      />
    </>
  );
}
