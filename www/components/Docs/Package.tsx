import { Box } from "@welcome-ui/box";
import React from "react";

import { Pkg } from "@/lib/docs";
import * as url from "@/lib/url";

import Documentation from "./Documentation";
import SymbolLinkTable from "./SymbolLinkTable";

interface Props {
  pkg: Pkg;
}

export default function Package({ pkg }: Props) {
  pkg.modules.sort((a, b) => a.name.localeCompare(b.name));
  return (
    <Box>
      <Documentation>{pkg.documentation}</Documentation>
      <SymbolLinkTable
        title="Modules"
        url={(mod) => url.mod(pkg, mod)}
        symbols={pkg.modules}
      />
    </Box>
  );
}
