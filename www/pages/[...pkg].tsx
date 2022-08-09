import React from "react";
import { Box } from "@welcome-ui/box";
import { Text } from "@welcome-ui/text";
import styled from "styled-components";

import { getPackage, getPackageIndex, Pkg } from "../lib/docs";
import Layout from "../components/Layout";
import Function from "../components/Function";
import Class from "../components/Class";
import ModuleListSidebar from "../components/ModuleListSidebar";
import Intersperse from "../components/Intersperse";

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
    <Layout
      title={`${pkg.name}==${pkg.version}`}
      sidebar={<ModuleListSidebar currentModule={symbol} pkg={pkg} />}
    >
      {content}
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
        <Text variant="h3">Classes</Text>
        <Intersperse separator={<hr />}>
          {mod.classes.map((cls) => (
            <Class key={cls.name} cls={cls} />
          ))}
        </Intersperse>
      </Box>
      <hr />
      <Box>
        <Text variant="h3">Functions</Text>
        {mod.functions.map((fn) => (
          <Function func={fn} key={fn.name}></Function>
        ))}
      </Box>
      <hr />{" "}
      <Box>
        <Text variant="h3">Variables</Text>
        {mod.variables.map((v) => (
          <Text key={v.name}>{v.name}</Text>
        ))}
      </Box>
    </Wrapper>
  );
}
