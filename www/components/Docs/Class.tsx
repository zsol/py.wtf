import React from "react";

import Intersperse from "@/components/Intersperse";
import * as hl from "@/components/highlight";

import * as docs from "@/lib/docs";

import { Code } from "../core/typography/Code";
import { H5 } from "../core/typography/Heading";
import Documentation from "./Documentation";
import Function from "./Function";
import Variable from "./Variable";

interface Props {
  cls: docs.Class; // Named to not conflict with the `class` keyword OR the `class` HTML attribute
  project: docs.Project;
}

function Methods({ cls, project }: Props) {
  if (cls.methods.length === 0) {
    return null;
  }
  return (
    <>
      <H5>Methods</H5>
      {cls.methods.map((method, index) => (
        <Function
          key={`${method.name}/${index}`}
          func={method}
          project={project}
        />
      ))}
    </>
  );
}

function Variables({
  title,
  variables,
  project,
}: {
  title: string;
  variables: docs.Variable[];
  project: docs.Project;
}) {
  if (variables.length === 0) {
    return null;
  }
  return (
    <>
      <H5>{title}</H5>
      {variables.map((v) => (
        <Variable key={v.name} variable={v} project={project} />
      ))}
    </>
  );
}

const ClassVariables = ({ cls, project }: Props) => (
  <Variables
    title="Class Variables"
    variables={cls.class_variables}
    project={project}
  />
);
const InstanceVariables = ({ cls, project }: Props) => (
  <Variables
    title="Instance Variables"
    variables={cls.instance_variables}
    project={project}
  />
);

export default function Class({ cls, project }: Props) {
  return (
    <div>
      <Code>
        <hl.Keyword>class</hl.Keyword> <hl.Ty>{cls.name}</hl.Ty>(
        <Intersperse separator=", ">
          {cls.bases.map((base) => (
            <hl.Ty key={base}>{base}</hl.Ty>
          ))}
        </Intersperse>
        )
      </Code>
      <Documentation>{cls.documentation}</Documentation>
      <Methods cls={cls} project={project} />
      <ClassVariables cls={cls} project={project} />
      <InstanceVariables cls={cls} project={project} />
      {cls.inner_classes.map((inner) => (
        // TODO: Make the inner-class-ness obvious from looking at the page
        <Class key={inner.name} cls={inner} project={project} />
      ))}
    </div>
  );
}
