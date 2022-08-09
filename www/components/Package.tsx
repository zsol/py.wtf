import React from "react";

import { Box } from "@welcome-ui/box";
import { Text } from "@welcome-ui/text";
import styled from "styled-components";

import Layout from "../components/Layout";
import ModuleListSidebar from "../components/ModuleListSidebar";
import Function from "../components/Function";
import Class from "../components/Class";
import Intersperse from "../components/Intersperse";

import { Pkg } from "../lib/docs";

function byName(a: { name }, b: { name }): number {
  if (a.name < b.name) {
    return -1;
  } else if (a.name > b.name) {
    return 1;
  }
  return 0;
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
        <Intersperse separator={(key) => <hr key={key} />}>
          {mod.classes.map((cls) => (
            <Class key={cls.name} cls={cls} />
          ))}
        </Intersperse>
      </Box>
      <hr />
      <Box>
        <Text variant="h3">Functions</Text>
        {mod.functions.map((fn, index) => (
          <Function func={fn} key={`${fn.name}/${index}`}></Function>
        ))}
      </Box>
      <hr />{" "}
      <Box>
        <Text variant="h3">Variables</Text>
        {mod.variables.map((v, index) => (
          <Text key={`${v.name}/${index}`}>{v.name}</Text>
        ))}
      </Box>
    </Wrapper>
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
    <Layout
      title={`${pkg.name}==${pkg.version}`}
      sidebar={<ModuleListSidebar currentModule={symbol} pkg={pkg} />}
    >
      {content}
    </Layout>
  );
}
