import { Box } from "@welcome-ui/box";
import React from "react";

import { Project } from "@/lib/docs";
import * as url from "@/lib/url";

import Documentation from "./Documentation";
import SymbolLinkTable from "./SymbolLinkTable";

interface Props {
  prj: Project;
}

export default function Proj({ prj }: Props) {
  prj.modules.sort((a, b) => a.name.localeCompare(b.name));
  return (
    <Box>
      <Documentation>{prj.documentation}</Documentation>
      <SymbolLinkTable
        title="Modules"
        url={(mod) => url.mod(prj, mod)}
        symbols={prj.modules}
      />
    </Box>
  );
}
