import styled from "@emotion/styled";
import React from "react";

import * as hl from "@/components/highlight";

import { Func } from "@/lib/docs";

import { Code } from "../core/typography/Code";
import { Text } from "../core/typography/Text";
import Documentation from "./Documentation";

const FuncDocs = styled(Documentation)`
  margin-left: ${(props) => props.theme.spacing.m};
`;

const ParamWrapper = styled(Text)`
  padding-left: ${(props) => props.theme.spacing.xl};
  margin-top: ${(props) => props.theme.spacing.xxs};
  margin-bottom: ${(props) => props.theme.spacing.xxs};

  &:first-child {
    margin-top: ${(props) => props.theme.spacing.xs};
  }
  &:last-child {
    margin-bottom: ${(props) => props.theme.spacing.xs};
  }
`;

const Param = (props: hl.VarWithTypeProps) => (
  <ParamWrapper>
    <hl.VarWithType comma {...props} />
  </ParamWrapper>
);

export default function Function({ func }: { func: Func }) {
  const def = func.asynchronous ? "async def" : "def";
  const ret = func.returns && (
    <>
      {" -> "}
      <hl.Ty>{func.returns}</hl.Ty>
    </>
  );
  const unqual = func.name.split(".").at(-1);

  return (
    <div>
      <Code>
        <hl.Keyword>{def}</hl.Keyword> <hl.Fn>{unqual}</hl.Fn>(
        {func.params.map((param) => (
          <Param name={param.name} type={param.type} key={param.name} />
        ))}
        ) {ret}
      </Code>
      <FuncDocs>{func.documentation}</FuncDocs>
    </div>
  );
}
