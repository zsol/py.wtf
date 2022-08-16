import React from "react";
import useSWR from "swr";

import * as docs from "@/lib/docs";
import * as url from "@/lib/url";

import Sidebar from "./Sidebar/Sidebar";
import ContentWithSidebar from "./core/layout/ContentWithSidebar";
import { H3 } from "./core/typography/Heading";

const fetcher = (input: RequestInfo | URL, init?: RequestInit) =>
  fetch(input, init).then((res) => res.json());

function fetchProject(name: string) {
  const projectJsonUrl = url.projectJson(name);
  return {
    projectJsonUrl,
    ...useSWR<docs.Project, Error>(projectJsonUrl, fetcher),
  };
}

interface Props {
  name?: string;
  content: (pkg: docs.Project) => React.ReactElement;
}

export default function FetchProject({ name, content }: Props) {
  if (name === undefined) {
    return null;
  }

  const { data, error, projectJsonUrl } = fetchProject(name);

  if (error)
    return (
      <div>
        Failed to load <code>{projectJsonUrl}</code>: {error.message}
      </div>
    );
  if (!data) {
    const dummyProject = {
      name,
      metadata: {
        version: "Loading...",
        dependencies: [],
      },
      documentation: [],
      modules: [],
    };

    return (
      <ContentWithSidebar sidebar={<Sidebar project={dummyProject} />}>
        <H3>Modules</H3>
        Loading...
      </ContentWithSidebar>
    );
  }

  return content(data);
}
