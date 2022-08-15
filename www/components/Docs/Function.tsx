import styled from "@emotion/styled";
import React from "react";

import * as hl from "@/components/highlight";

import * as docs from "@/lib/docs";

import { xref } from "../../lib/url";
import { Code } from "../core/typography/Code";
import { Text } from "../core/typography/Text";
import Documentation from "./Documentation";
import TypeAnnotation from "./TypeAnnotation";
import { VarWithType, VarWithTypeProps } from "./Variable";

const FuncDocs = styled(Documentation)`
  margin-left: ${(props) => props.theme.spacing.m};
`;

const ParamWrapper = styled(Text)`
  padding-left: ${(props) => props.theme.spacing.xl};
  margin-top: ${(props) => props.theme.spacing.xxs};
  margin-bottom: ${(props) => props.theme.spacing.xxs};

  &:first-of-type {
    margin-top: ${(props) => props.theme.spacing.xs};
  }
  &:last-of-type {
    margin-bottom: ${(props) => props.theme.spacing.xs};
  }
`;

const Param = (props: VarWithTypeProps) => (
  <ParamWrapper>
    <VarWithType comma {...props} />
  </ParamWrapper>
);

export interface FunctionProps {
  func: docs.Func;
  project: docs.Project;
  anchor?: string;
}

export default function Function({ func, project, anchor }: FunctionProps) {
  const def = func.asynchronous ? "async def" : "def";
  const ret = func.returns && (
    <>
      {"-> "}
      <TypeAnnotation type={func.returns} url={xref.bind(null, project)} />
    </>
  );
  const unqual = func.name.split(".").at(-1);

  return (
    <div>
      <Code anchor={anchor}>
        <hl.Keyword>{def}</hl.Keyword> <hl.Fn>{unqual}</hl.Fn>(
        {func.params.map((param) => (
          <Param
            name={param.name}
            type={param.type ?? undefined}
            key={param.name}
            project={project}
          />
        ))}
        ) {ret}
      </Code>
      <FuncDocs>{func.documentation}</FuncDocs>
    </div>
  );
}
