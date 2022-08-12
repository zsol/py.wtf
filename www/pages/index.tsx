import { WuiProvider, createTheme } from "@welcome-ui/core";
import { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import React from "react";

import { Project, getProject, listProjects, ProjectMetadata } from "@/lib/docs";
import * as url from "@/lib/url";
import SymbolLinkTable from "@/components/Docs/SymbolLinkTable";

export const getStaticProps: GetStaticProps<Props> = async () => {
  const projectNames = await listProjects();
  const projects = await Promise.all(
    projectNames.map(async (name) => {
      const proj = await getProject(name);
      return {
        name,
        documentation: [`${proj.metadata.summary ?? ""}`],
      };
    })
  );
  return {
    props: {
      projects,
    },
  };
};

const theme = createTheme();

interface Props {
  projects: { name: string; documentation: string[] }[];
}

export default function Home({ projects }: Props) {
  return (
    <WuiProvider theme={theme}>
      <div className="container">
        <Head>
          <title>py.wtf</title>
          {/*<link rel="icon" href="/favicon.ico" /> */}
        </Head>

        <main>
          <SymbolLinkTable
            title="Projects"
            url={(prj) => url.project(prj as Project)}
            symbols={projects}
            useReactRouter={false}
          />
        </main>

        <footer>Footer.</footer>

        <style jsx>{`
          .container {
            min-height: 100vh;
            padding: 0 0.5rem;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }

          main {
            padding: 5rem 0;
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }

          footer {
            width: 100%;
            height: 100px;
            border-top: 1px solid #eaeaea;
            display: flex;
            justify-content: center;
            align-items: center;
          }
        `}</style>
      </div>
    </WuiProvider>
  );
}
