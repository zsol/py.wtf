import * as docs from "@/lib/docs";
import * as url from "@/lib/url";

import { RouterLink } from "../core/navigation/Link";
import { H3 } from "../core/typography/Heading";
import Documentation from "./Documentation";
import SymbolLinkTable from "./SymbolLinkTable";

interface Props {
  prj: docs.Project;
  mod: docs.Module;
}

export default function Module({ prj, mod }: Props) {
  function LinkTable({
    title,
    symbols,
  }: {
    title: string;
    symbols: (docs.Class | docs.Func | docs.Variable)[];
  }) {
    return (
      <SymbolLinkTable
        title={title}
        url={(sym) => url.symbol(prj, mod, sym)}
        symbols={symbols}
        stripPrefix={mod.name}
      />
    );
  }
  return (
    <div>
      <H3>Module {mod.name}</H3>
      <Documentation project={prj}>{mod.documentation}</Documentation>
      <Exports prj={prj} exps={mod.exports} />
      <LinkTable title="Classes" symbols={mod.classes} />
      <LinkTable title="Functions" symbols={mod.functions} />
      <LinkTable title="Variables" symbols={mod.variables} />
    </div>
  );
}

interface ExportsProps {
  prj: docs.Project;
  exps: docs.Export[];
}

function Exports({ prj, exps }: ExportsProps) {
  if (exps.length === 0) {
    return null;
  }
  return (
    <div>
      <H3>Exports</H3>
      {exps.map((exp) => (
        <div key={exp.name}>
          <Export prj={prj} exp={exp} />
        </div>
      ))}
    </div>
  );
}

interface ExportProps {
  prj: docs.Project;
  exp: docs.Export;
}

function Export({ prj, exp }: ExportProps) {
  const to = url.xref(prj, exp.xref);
  return to == null ? (
    <span>{exp.name}</span>
  ) : (
    <RouterLink to={to}>{exp.name}</RouterLink>
  );
}
