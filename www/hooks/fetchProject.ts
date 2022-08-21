import useSWR from "swr";

import * as docs from "@/lib/docs";
import { projectJson as getProjectJsonUrl } from "@/lib/url";

const fetcher = (input: RequestInfo | URL, init?: RequestInit) =>
  fetch(input, init).then((res) => res.json());

const useFetchProject = (projectName: string) => {
  const projectJsonUrl = getProjectJsonUrl(projectName);

  const { data, error } = useSWR<docs.Project, Error>(projectJsonUrl, fetcher);

  return {
    isLoading: !(error || data),
    error,
    project: data,
    projectJsonUrl,
  };
};

export default useFetchProject;
