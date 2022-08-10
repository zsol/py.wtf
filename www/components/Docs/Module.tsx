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
  const mkUrl = url.symbol.bind(null, pkg, mod);
  function LinkTable<T extends Sym>({
    title,
    symbols,
  }: {
    title: string;
    symbols: T[];
  }) {
    return (
      <SymbolLinkTable<T>
        title={title}
        url={mkUrl}
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
