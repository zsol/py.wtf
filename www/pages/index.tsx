import { WuiProvider, createTheme } from "@welcome-ui/core";
import { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import React from "react";
import styled from "styled-components";

import { theme } from "@/components/core/theme/theme";

import { Pkg, getPackage, listPackages } from "@/lib/docs";
import * as url from "@/lib/url";

export const getStaticProps: GetStaticProps<Props> = async () => {
  const packageNames = await listPackages();
  const packages = await Promise.all(
    packageNames.map(async (name) => ({
      name,
      version: (await getPackage(name)).version,
    }))
  );
  return {
    props: {
      packages,
    },
  };
};

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  min-height: 100vh;
  padding: 0 0.5rem;

  background-color: ${(props) => props.theme.colors.slate[500]};
  color: ${(props) => props.theme.colors.grey[300]};
`;

const StyledPackageLink = styled.a`
  color: cornflowerblue;
`;

const Content = styled.main`
  padding: 5rem 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const Footer = styled.footer`
  width: 100%;
  height: 100px;
  border-top: 1px solid #eaeaea;
  display: flex;
  justify-content: center;
  align-items: center;
`;

interface Props {
  packages: { name: string; version: string }[];
}

export default function Home({ packages }: Props) {
  return (
    <WuiProvider theme={theme}>
      <PageContainer>
        <Head>
          <title>py.wtf</title>
          {/*<link rel="icon" href="/favicon.ico" /> */}
        </Head>

        <Content>
          <ul>
            {packages.map((pkg) => (
              <li key={`${pkg.name}-${pkg.version}`}>
                <StyledPackageLink href={url.pkg(pkg as Pkg)}>
                  {pkg.name}
                </StyledPackageLink>{" "}
                ({pkg.version})
              </li>
            ))}
          </ul>
        </Content>

        <Footer>Footer.</Footer>
      </PageContainer>
    </WuiProvider>
  );
}
