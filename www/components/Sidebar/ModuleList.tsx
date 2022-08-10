import React from "react";

import { Module, Pkg } from "@/lib/docs";
import * as url from "@/lib/url";

import SidebarLinkList from "./SidebarLinkList";

interface Props {
  pkg: Pkg;
  currentModule: Module;
}

export default function ModuleList({ pkg, currentModule }: Props) {
  return (
    <SidebarLinkList
      title="Modules"
      items={pkg.modules}
      active={currentModule.name}
      stripPrefix={pkg.name}
      url={url.mod.bind(null, pkg)}
    />
  );
}
