import React from "react";

import { Class, Func, Module, Project, Variable } from "@/lib/docs";
import * as url from "@/lib/url";

import { H4 } from "../core/typography/Heading";
import SidebarLinkList from "./SidebarLinkList";

interface Props {
  prj: Project;
  mod: Module;
  currentSymbol: string;
}

export default function ModuleContents({ prj, mod, currentSymbol }: Props) {
  function LinkList({
    title,
    items,
  }: {
    title: string;
    items: (Class | Func | Variable)[];
  }) {
    return (
      <SidebarLinkList
        title={title}
        items={items}
        active={currentSymbol}
        stripPrefix={mod.name}
        url={(sym) => url.symbol(prj, mod, sym)}
      />
    );
  }

  return (
    <>
      <H4>In {mod.name}</H4>
      <LinkList title="Classes" items={mod.classes} />
      <LinkList title="Functions" items={mod.functions} />
      <LinkList title="Variables" items={mod.variables} />
    </>
  );
}
