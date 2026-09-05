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
  return (
    <>
      <H4>In {mod.name}</H4>
      <LinkList
        prj={prj}
        mod={mod}
        currentSymbol={currentSymbol}
        title="Classes"
        items={mod.classes}
      />
      <LinkList
        prj={prj}
        mod={mod}
        currentSymbol={currentSymbol}
        title="Functions"
        items={mod.functions}
      />
      <LinkList
        prj={prj}
        mod={mod}
        currentSymbol={currentSymbol}
        title="Variables"
        items={mod.variables}
      />
    </>
  );
}

function LinkList({
  prj,
  mod,
  currentSymbol,
  title,
  items,
}: Props & {
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
