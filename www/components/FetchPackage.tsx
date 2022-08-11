import { Box } from "@welcome-ui/box";
import React from "react";
import useSWR from "swr";

import * as docs from "@/lib/docs";
import * as url from "@/lib/url";

const fetcher = (input: RequestInfo | URL, init?: RequestInit) =>
  fetch(input, init).then((res) => res.json());

interface Props {
  name?: string;
  content: (pkg: docs.Pkg) => React.ReactElement;
}

export default function FetchPackage({ name, content }: Props) {
  if (name === undefined) {
    return null;
  }
  const pkgJsonUrl = url.pkgJson(name);
  const { data, error } = useSWR<docs.Pkg, Error>(pkgJsonUrl, fetcher);

  if (error)
    return (
      <Box>
        Failed to load <code>{pkgJsonUrl}</code>: {error.message}
      </Box>
    );
  if (!data) return <Box>Loading...</Box>;

  return content(data);
}
