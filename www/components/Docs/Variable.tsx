import { Code } from "@/components/core/typography/Code";
import * as hl from "@/components/highlight";

import * as docs from "@/lib/docs";
import { xref } from "@/lib/url";

import Documentation from "./Documentation";
import TypeAnnotation from "./TypeAnnotation";

interface Props {
  variable: docs.Variable;
  project: docs.Project;
  anchor?: string;
}

export default function Variable({ variable, project, anchor }: Props) {
  return (
    <div>
      <Code anchor={anchor}>
        <VarWithType
          name={variable.name}
          type={variable.type ?? null}
          project={project}
          default={null}
        />
      </Code>
      <Documentation project={project}>{variable.documentation}</Documentation>
    </div>
  );
}

export interface VarWithTypeProps {
  name: string;
  type: docs.Typ | null;
  project: docs.Project;
  default: string | null;
  comma?: boolean;
}

export function VarWithType({
  name,
  type,
  project,
  default: defaultValue,
  comma = false,
}: VarWithTypeProps) {
  return (
    <>
      {name}
      {type !== null && (
        <>
          : <TypeAnnotation type={type} url={xref.bind(null, project)} />
        </>
      )}
      {defaultValue !== null && (
        <>
          <hl.Operator>=</hl.Operator>
          <hl.Literal>{defaultValue}</hl.Literal>
        </>
      )}
      {comma && ","}
    </>
  );
}
