import React from "react";

import * as docs from "../../lib/docs";
import { Code } from "../core/typography/Code";
import * as hl from "../highlight";
import Documentation from "./Documentation";

interface Props {
  variable: docs.Variable;
}

export default function Variable({ variable }: Props) {
  return (
    <div>
      <Code>
        <hl.VarWithType name={variable.name} type={variable.type} />
      </Code>
      <Documentation>{variable.documentation}</Documentation>
    </div>
  );
}
