import React from "react";
import { Text } from "@welcome-ui/text";
import { Box } from "@welcome-ui/box";
import { Func } from "../lib/docs";
import Documentation from "./documentation";
import styled from "styled-components";

const ParamWrapper = styled(Text)`
  margin-left: 2em;
  margin-top: 0;
  margin-bottom: 0;
`;

function Param({ name, type }) {
  const typeann = type === null ? "" : `: ${type}`;
  return (
    <ParamWrapper>
      {name}
      {typeann},
    </ParamWrapper>
  );
}

const Container = styled(Box)`
  margin: 0.5em;
`;
const FuncDocs = styled(Documentation)`
  margin-left: 1em;
`;

export default function Function({ func }: { func: Func }) {
  const def = func.asynchronous ? "async def" : "def";
  const ret = func.returns === null ? "" : `-> ${func.returns}`;
  const unqual = func.name.split(".").at(-1);

  return (
    <Container>
      <Text as="code" backgroundColor="light.900">
        {def} {unqual}(
        {func.params.map((param) => (
          <Param name={param.name} type={param.type} key={param.name} />
        ))}
        ) {ret}
      </Text>
      <FuncDocs>{func.documentation}</FuncDocs>
    </Container>
  );
}
