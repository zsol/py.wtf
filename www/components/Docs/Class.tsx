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
}

function Methods({ cls }: Props) {
  if (cls.methods.length === 0) {
    return null;
  }
  return (
    <>
      <H5>Methods</H5>
      {cls.methods.map((method, index) => (
        <Function key={`${method.name}/${index}`} func={method} />
      ))}
    </>
  );
}

function Variables({
  title,
  variables,
}: {
  title: string;
  variables: docs.Variable[];
}) {
  if (variables.length === 0) {
    return null;
  }
  return (
    <>
      <H5>{title}</H5>
      {variables.map((v) => (
        <Variable key={v.name} variable={v} />
      ))}
    </>
  );
}

const ClassVariables = ({ cls }: Props) => (
  <Variables title="Class Variables" variables={cls.class_variables} />
);
const InstanceVariables = ({ cls }: Props) => (
  <Variables title="Instance Variables" variables={cls.instance_variables} />
);

export default function Class({ cls }: Props) {
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
      <Methods cls={cls} />
      <ClassVariables cls={cls} />
      <InstanceVariables cls={cls} />
      {cls.inner_classes.map((inner) => (
        // TODO: Make the inner-class-ness obvious from looking at the page
        <Class key={inner.name} cls={inner} />
      ))}
    </div>
  );
}
