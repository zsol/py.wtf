import { Text } from "@welcome-ui/text";
import React from "react";

import { Class, Module, Pkg } from "@/lib/docs";
import * as url from "@/lib/url";

import SidebarLinkList from "./SidebarLinkList";

interface Props {
  pkg: Pkg;
  mod: Module;
  cls: Class;
  currentSymbol: string;
}

export default function ClassContents({ pkg, mod, cls, currentSymbol }: Props) {
  const symbolUrl = url.symbol.bind(null, pkg, mod);
  const anchorUrl = url.symbol.bind(null, pkg, mod, cls);
  return (
    <>
      <Text variant="h4">{cls.name}</Text>
      <SidebarLinkList
        title="Methods"
        items={cls.methods}
        url={anchorUrl}
        active={currentSymbol}
      />
      <SidebarLinkList
        title="Class Variables"
        items={cls.class_variables}
        url={anchorUrl}
        active={currentSymbol}
      />
      <SidebarLinkList
        title="Instance Variables"
        items={cls.instance_variables}
        url={anchorUrl}
        active={currentSymbol}
      />
      <SidebarLinkList
        title="Inner Classes"
        items={cls.inner_classes}
        url={symbolUrl}
        active={currentSymbol}
      />
    </>
  );
}
