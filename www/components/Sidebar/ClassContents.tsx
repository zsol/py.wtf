import { Text } from "@welcome-ui/text";
import React from "react";
import { UrlObject } from "url";

import { Class, Module, Pkg } from "@/lib/docs";
import * as url from "@/lib/url";
import { withoutPrefix } from "@/lib/url";

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

  function LinkList<T extends { name: string }>({
    title,
    items,
    url,
  }: {
    title: string;
    items: T[];
    url: (sym: T) => UrlObject;
  }) {
    return (
      <SidebarLinkList<T>
        title={title}
        items={items}
        active={currentSymbol}
        stripPrefix={cls.name}
        url={url}
      />
    );
  }

  return (
    <>
      <Text variant="h4">{withoutPrefix(mod.name, cls.name)}</Text>
      <LinkList title="Methods" items={cls.methods} url={anchorUrl} />
      <LinkList
        title="Class Variables"
        items={cls.class_variables}
        url={anchorUrl}
      />
      <LinkList
        title="Instance Variables"
        items={cls.instance_variables}
        url={anchorUrl}
      />
      <LinkList
        title="Inner Classes"
        items={cls.inner_classes}
        url={symbolUrl}
      />
    </>
  );
}
