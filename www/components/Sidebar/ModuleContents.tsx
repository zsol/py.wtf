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
  function LinkList<T extends { name: string }>({
    title,
    items,
  }: {
    title: string;
    items: T[];
  }) {
    return (
      <SidebarLinkList<T>
        title={title}
        items={items}
        active={currentSymbol}
        stripPrefix={mod.name}
        url={(sym) => url.symbol(pkg, mod, sym)}
      />
    );
  }

  return (
    <>
      <Text variant="h4">In {mod.name}</Text>
      <LinkList title="Classes" items={mod.classes} />
      <LinkList title="Functions" items={mod.functions} />
      <LinkList title="Variables" items={mod.variables} />
    </>
  );
}
