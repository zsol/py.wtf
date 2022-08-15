import * as docs from "../../lib/docs";
import { xref } from "../../lib/url";
import { Code } from "../core/typography/Code";
import Documentation from "./Documentation";
import TypeAnnotation from "./TypeAnnotation";

interface Props {
  variable: docs.Variable;
  project: docs.Project;
}

export default function Variable({ variable, project }: Props) {
  return (
    <div>
      <Code>
        <VarWithType
          name={variable.name}
          type={variable.type}
          project={project}
        />
      </Code>
      <Documentation>{variable.documentation}</Documentation>
    </div>
  );
}

export interface VarWithTypeProps {
  name: string;
  type?: docs.Typ;
  project: docs.Project;
  comma?: boolean;
}

export function VarWithType({
  name,
  type,
  project,
  comma = false,
}: VarWithTypeProps) {
  return (
    <>
      {name}
      {type != null && (
        <>
          : <TypeAnnotation type={type} url={xref.bind(null, project)} />
        </>
      )}
      {comma && ","}
    </>
  );
}
