import { Box } from "@welcome-ui/box";
import { Text } from "@welcome-ui/text";
import React from "react";
import useSWR from "swr";

import * as docs from "@/lib/docs";
import * as url from "@/lib/url";

import Layout from "./Layout";

const fetcher = (input: RequestInfo | URL, init?: RequestInit) =>
  fetch(input, init).then((res) => res.json());

interface Props {
  name?: string;
  content: (pkg: docs.Project) => React.ReactElement;
}

export default function FetchProject({ name, content }: Props) {
  if (name === undefined) {
    return null;
  }
  const projectJsonUrl = url.projectJson(name);
  const { data, error } = useSWR<docs.Project, Error>(projectJsonUrl, fetcher);

  if (error)
    return (
      <Box>
        Failed to load <code>{projectJsonUrl}</code>: {error.message}
      </Box>
    );
  if (!data)
    return (
      <Layout
        project={{
          name,
          metadata: {
            version: "Loading...",
            dependencies: [],
          },
          documentation: [],
          modules: [],
        }}
      >
        <Text variant="h3">Modules</Text>
        Loading...
      </Layout>
    );

  return content(data);
}
