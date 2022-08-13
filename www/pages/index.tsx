import { ThemeProvider } from "@emotion/react";
import styled from "@emotion/styled";
import { GetStaticProps } from "next";
import Head from "next/head";
import React from "react";

import FullPageBackground from "@/components/core/layout/FullPageBackground";
import { flexColumnCenter } from "@/components/core/layout/helpers";
import { Link } from "@/components/core/navigation/Link";
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

const Content = styled.main`
  ${flexColumnCenter}
  flex: 1;

  padding: 5rem 0;
`;

const Footer = styled.footer`
  ${flexColumnCenter}

  width: 100%;
  height: 100px;

  border-top: 1px solid #eaeaea;
`;

interface Props {
  projects: { name: string; metadata: ProjectMetadata }[];
}

export default function Home({ projects }: Props) {
  return (
    <ThemeProvider theme={darkTheme}>
      <FullPageBackground>
        <Head>
          <title>py.wtf</title>
          {/*<link rel="icon" href="/favicon.ico" /> */}
        </Head>

        <Content>
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
        </Content>

        <Footer>Footer.</Footer>
      </FullPageBackground>
    </ThemeProvider>
  );
}
