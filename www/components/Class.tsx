import { Text } from "@welcome-ui/text";
import { Box } from "@welcome-ui/box";
import React from "react";

import * as docs from "../lib/docs";
import * as hl from "./highlight";
import Intersperse from "./Intersperse";
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
      <Text variant="h5">Methods</Text>
      {cls.methods.map((method) => (
        <Function key={method.name} func={method} />
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
      <Text variant="h5">{title}</Text>
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
    <Box>
      <hl.Container variant="h4">
        <hl.Keyword>class</hl.Keyword> <hl.Ty>{cls.name}</hl.Ty>(
        <Intersperse separator=", ">
          {cls.bases.map((base) => (
            <hl.Ty key={base}>{base}</hl.Ty>
          ))}
        </Intersperse>
        )
      </hl.Container>
      <Documentation>{cls.documentation}</Documentation>
      <Methods cls={cls} />
      <ClassVariables cls={cls} />
      <InstanceVariables cls={cls} />
      {cls.inner_classes.map((inner) => (
        // TODO: Make the inner-class-ness obvious from looking at the page
        <Class key={inner.name} cls={inner} />
      ))}
    </Box>
  );
}
