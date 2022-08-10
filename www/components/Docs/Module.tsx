import { Box } from "@welcome-ui/box";
import { Text } from "@welcome-ui/text";
import React from "react";

import * as docs from "@/lib/docs";
import * as url from "@/lib/url";

import Documentation from "./Documentation";
import SymbolLinkTable, { Sym } from "./SymbolLinkTable";

interface Props {
  pkg: docs.Pkg;
  mod: docs.Module;
}

export default function Module({ pkg, mod }: Props) {
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
        url={(sym) => url.symbol(pkg, mod, sym)}
        symbols={symbols}
        stripPrefix={mod.name}
      />
    );
  }
  return (
    <Box>
      <Text variant="h3">Module {mod.name}</Text>
      <Documentation>{pkg.documentation}</Documentation>
      <LinkTable title="Classes" symbols={mod.classes} />
      <LinkTable title="Functions" symbols={mod.functions} />
      <LinkTable title="Variables" symbols={mod.variables} />
    </Box>
  );
}
