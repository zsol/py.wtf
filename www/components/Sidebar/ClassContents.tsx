import React from "react";

import { Class, Module, Project } from "@/lib/docs";
import * as url from "@/lib/url";
import { withoutPrefix } from "@/lib/url";

import { H4 } from "../core/typography/Heading";
import SidebarLinkList from "./SidebarLinkList";

interface Props {
  prj: Project;
  mod: Module;
  cls: Class;
}

export default function ClassContents({ prj, mod, cls }: Props) {
  const symbolUrl = url.symbol.bind(null, prj, mod);
  const anchorUrl = url.classItem.bind(null, prj, mod, cls);

  return (
    <>
      <H4>{withoutPrefix(mod.name, cls.name)}</H4>
      <LinkList cls={cls} title="Methods" items={cls.methods} url={anchorUrl} />
      <LinkList
        cls={cls}
        title="Class Variables"
        items={cls.class_variables}
        url={anchorUrl}
      />
      <LinkList
        cls={cls}
        title="Instance Variables"
        items={cls.instance_variables}
        url={anchorUrl}
      />
      <LinkList
        cls={cls}
        title="Inner Classes"
        items={cls.inner_classes}
        url={symbolUrl}
      />
    </>
  );
}

function LinkList<T extends { name: string }>({
  cls,
  title,
  items,
  url,
}: Pick<Props, "cls"> & {
  title: string;
  items: T[];
  url: (sym: T) => string;
}) {
  return (
    <SidebarLinkList<T>
      title={title}
      items={items}
      active=""
      stripPrefix={cls.name}
      url={url}
    />
  );
}
