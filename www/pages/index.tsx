import { ThemeProvider } from "@emotion/react";
import styled from "@emotion/styled";
import { GetStaticProps } from "next";
import Head from "next/head";

import SymbolLinkTable from "@/components/Docs/SymbolLinkTable";
import FullPageBackground from "@/components/core/layout/FullPageBackground";
import { flexColumnCenter } from "@/components/core/layout/helpers";
import { darkTheme } from "@/components/core/theme/theme";

import { Project } from "@/lib/docs";
import { getProject, listProjects } from "@/lib/docs_server";
import * as url from "@/lib/url";

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

export interface Props {
  projects: { name: string; documentation: string[] }[];
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
          <SymbolLinkTable
            title="Projects"
            url={(prj) => url.project(prj as Project)}
            symbols={projects}
            useReactRouter={false}
          />
        </Content>

        <Footer>Footer.</Footer>
      </FullPageBackground>
    </ThemeProvider>
  );
}
