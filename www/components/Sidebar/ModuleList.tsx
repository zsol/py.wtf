import React from "react";

import { Module, Project } from "@/lib/docs";
import * as url from "@/lib/url";

import SidebarLinkList from "./SidebarLinkList";

interface Props {
  prj: Project;
  currentModule?: Module;
}

export default function ModuleList({ prj, currentModule }: Props) {
  return (
    <SidebarLinkList
      title="Modules"
      items={prj.modules}
      active={currentModule?.name}
      url={url.mod.bind(null, prj)}
    />
  );
}
