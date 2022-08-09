import React from "react";

import { Box } from "@welcome-ui/box";
import { Text } from "@welcome-ui/text";

import * as docs from "../lib/docs";
import * as hl from "./highlight";
import Documentation from "./Documentation";

interface Props {
  variable: docs.Variable;
}

export default function Variable({ variable }: Props) {
  return (
    <Box>
      <hl.Container>
        <hl.VarWithType name={variable.name} type={variable.type} />
      </hl.Container>
      <Documentation>{variable.documentation}</Documentation>
    </Box>
  );
}
