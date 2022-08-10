import { Box } from "@welcome-ui/box";
import { Text } from "@welcome-ui/text";
import React from "react";
import styled from "styled-components";

import { Func } from "../../lib/docs";
import * as hl from "../highlight";
import Documentation from "./Documentation";

const Container = styled(Box)`
  margin: 0.5em;
`;
const FuncDocs = styled(Documentation)`
  margin-left: 1em;
`;

const ParamWrapper = styled(Text)`
  margin-left: 2em;
  margin-top: 0;
  margin-bottom: 0;
`;
const Param = (props) => (
  <ParamWrapper>
    <hl.VarWithType comma {...props} />
  </ParamWrapper>
);

export default function Function({ func }: { func: Func }) {
  const def = func.asynchronous ? "async def" : "def";
  const ret =
    func.returns === null ? (
      <></>
    ) : (
      <>
        {" -> "}
        <hl.Ty>{func.returns}</hl.Ty>
      </>
    );
  const unqual = func.name.split(".").at(-1);

  return (
    <Container>
      <hl.Container>
        <hl.Keyword>{def}</hl.Keyword> <hl.Fn>{unqual}</hl.Fn>(
        {func.params.map((param) => (
          <Param name={param.name} type={param.type} key={param.name} />
        ))}
        ) {ret}
      </hl.Container>
      <FuncDocs>{func.documentation}</FuncDocs>
    </Container>
  );
}
