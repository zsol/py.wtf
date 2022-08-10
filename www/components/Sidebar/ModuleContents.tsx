import { Text } from "@welcome-ui/text";
import React from "react";

import { Module, Pkg } from "@/lib/docs";
import * as url from "@/lib/url";

import SidebarLinkList from "./SidebarLinkList";

interface Props {
  pkg: Pkg;
  mod: Module;
  currentSymbol: string;
}

export default function ModuleContents({ pkg, mod, currentSymbol }: Props) {
  const mkUrl = url.symbol.bind(null, pkg, mod);
  return (
    <>
      <Text variant="h4">In {mod.name}</Text>
      <SidebarLinkList
        title="Classes"
        items={mod.classes}
        url={mkUrl}
        active={currentSymbol}
      />
      <SidebarLinkList
        title="Functions"
        items={mod.functions}
        url={mkUrl}
        active={currentSymbol}
      />
      <SidebarLinkList
        title="Variables"
        items={mod.variables}
        url={mkUrl}
        active={currentSymbol}
      />
    </>
  );
}
