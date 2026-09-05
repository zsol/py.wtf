import useSWR from "swr";

import * as docs from "@/lib/docs";
import { projectJson as getProjectJsonUrl } from "@/lib/url";

const fetcher = (input: RequestInfo | URL, init?: RequestInit) =>
  fetch(input, init).then((res) => res.json());

const useFetchProject = (projectName: string | undefined) => {
  const projectJsonUrl = projectName ? getProjectJsonUrl(projectName) : "";

  const { data, error, isLoading } = useSWR<docs.Project, Error>(
    projectJsonUrl || null,
    fetcher,
  );

  return {
    isLoading,
    error,
    project: data,
    projectJsonUrl,
  };
};

export default useFetchProject;
