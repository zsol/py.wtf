import React from "react";

import * as docs from "@/lib/docs";
import * as url from "@/lib/url";

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
      <Documentation>{prj.documentation}</Documentation>
      <LinkTable title="Classes" symbols={mod.classes} />
      <LinkTable title="Functions" symbols={mod.functions} />
      <LinkTable title="Variables" symbols={mod.variables} />
    </div>
  );
}
