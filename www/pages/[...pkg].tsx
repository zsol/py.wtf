import React, { ReactNode } from "react";
import { getPackage, getPackageIndex, Pkg } from "../lib/docs";
import { createTheme, WuiProvider } from "@welcome-ui/core";
import { Flex } from "@welcome-ui/flex";
import { Stack } from "@welcome-ui/stack";
import { Box } from "@welcome-ui/box";
import { darkTheme } from "@welcome-ui/themes.dark";
import { welcomeTheme } from "@welcome-ui/themes.welcome";
import { Text } from "@welcome-ui/text";
import Layout from "../components/layout";
import { Link } from "@welcome-ui/link";
import Function from "../components/function";
import styled from "styled-components";

export async function getStaticProps({ params }) {
  const pkg = getPackage(params.pkg[0]);
  const symbol = params.pkg.length > 1 ? { symbol: params.pkg[1] } : {};
  return {
    props: {
      pkg: pkg,
      ...symbol,
    },
  };
}

export async function getStaticPaths() {
  const idx = getPackageIndex();
  // OMG CLEAN THIS UP
  const paths = [
    ...idx.map((val) => ({ params: { pkg: [val.name] } })),
    ...idx.flatMap((val) =>
      val.modules.map((mod) => ({ params: { pkg: [val.name, mod.name] } }))
    ),
  ];
  return {
    paths,
    fallback: false,
  };
}

function byName(a: { name }, b: { name }): number {
  if (a.name < b.name) {
    return -1;
  } else if (a.name > b.name) {
    return 1;
  }
  return 0;
}

const Modules = styled.div`
  max-width: 20em;
  overflow: auto;
`;

function ModuleBrowser({ pkg, children }: { pkg: Pkg; children: ReactNode }) {
  return (
    <Flex>
      <Modules>
        <Stack backgroundColor="light.500">
          <Box backgroundColor="light.200">
            <Box>
              <Text variant="h3" textAlign="center">
                Modules
              </Text>
              {pkg.modules.map((mod) => (
                <Text key={mod.name}>
                  <Link href={`/${pkg.name}/${mod.name}`}>{mod.name}</Link>
                </Text>
              ))}
            </Box>
          </Box>
        </Stack>
      </Modules>
      <Box>{children}</Box>
    </Flex>
  );
}

export default function Package({
  pkg,
  symbol,
}: {
  pkg: Pkg;
  symbol?: string;
}) {
  const docs = pkg.documentation.map((doc, ind) => <p key={ind}>{doc}</p>);
  const classes = pkg.modules.flatMap((mod) => mod.classes);
  const functions = pkg.modules.flatMap((mod) => mod.functions);
  const variables = pkg.modules.flatMap((mod) => mod.variables);
  const modules = pkg.modules;
  modules.sort(byName);
  classes.sort(byName);
  functions.sort(byName);
  variables.sort(byName);
  const content = symbol === undefined ? docs : Content(pkg, symbol);
  return (
    <Layout title={`${pkg.name}==${pkg.version}`}>
      <ModuleBrowser pkg={pkg}>{content}</ModuleBrowser>
    </Layout>
  );
}

const Wrapper = styled.div`
  max-width: 80em;
`;

function Content(pkg: Pkg, symbol: string) {
  const mod = pkg.modules.find((mod) => mod.name == symbol);
  mod.classes.sort(byName);
  mod.functions.sort(byName);
  mod.variables.sort(byName);

  return (
    <Wrapper>
      <Text>{mod.documentation}</Text>
      <Box>
        <h3>Classes</h3>
        {mod.classes.map((cls) => (
          <Text key={cls.name}>{cls.name}</Text>
        ))}
      </Box>
      <hr />
      <Box>
        <h3>Functions</h3>
        {mod.functions.map((fn) => (
          <Function func={fn} key={fn.name}></Function>
        ))}
      </Box>
      <hr />{" "}
      <Box>
        <h3>Variables</h3>
        {mod.variables.map((v) => (
          <Text key={v.name}>{v.name}</Text>
        ))}
      </Box>
    </Wrapper>
  );
}
