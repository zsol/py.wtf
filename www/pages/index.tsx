import { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import React from "react";
import { ThemeProvider } from "styled-components";

import { darkTheme } from "@/components/core/theme/theme";

import { Project, ProjectMetadata, getProject, listProjects } from "@/lib/docs";
import * as url from "@/lib/url";

export const getStaticProps: GetStaticProps<Props> = async () => {
  const projectNames = await listProjects();
  const projects = await Promise.all(
    projectNames.map(async (name) => ({
      name,
      metadata: (await getProject(name)).metadata,
    }))
  );
  return {
    props: {
      projects,
    },
  };
};

interface Props {
  projects: { name: string; metadata: ProjectMetadata }[];
}

export default function Home({ projects }: Props) {
  return (
    <ThemeProvider theme={darkTheme}>
      <div className="container">
        <Head>
          <title>py.wtf</title>
          {/*<link rel="icon" href="/favicon.ico" /> */}
        </Head>

        <main>
          <ul>
            {projects.map((prj) => (
              <li key={`${prj.name}-${prj.metadata.version}`}>
                <Link href={url.project(prj as Project)}>
                  <a>{prj.name}</a>
                </Link>{" "}
                ({prj.metadata.version})
              </li>
            ))}
          </ul>
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
    </ThemeProvider>
  );
}
