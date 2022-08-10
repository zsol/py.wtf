import { Box } from "@welcome-ui/box";
import { Text } from "@welcome-ui/text";
import React from "react";

import * as docs from "@/lib/docs";
import * as url from "@/lib/url";

import Documentation from "./Documentation";
import SymbolLinkTable from "./SymbolLinkTable";

interface Props {
  pkg: docs.Pkg;
  mod: docs.Module;
}

export default function Module({ pkg, mod }: Props) {
  const mkUrl = url.symbol.bind(null, pkg, mod);
  return (
    <Box>
      <Text variant="h3">Module {mod.name}</Text>
      <Documentation>{pkg.documentation}</Documentation>
      <SymbolLinkTable title="Classes" symbols={mod.classes} url={mkUrl} />
      <SymbolLinkTable title="Functions" symbols={mod.functions} url={mkUrl} />
      <SymbolLinkTable title="Variables" symbols={mod.variables} url={mkUrl} />
    </Box>
  );
}
