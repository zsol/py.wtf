import { GetStaticProps } from "next";

import SymbolLinkTable from "@/components/Docs/SymbolLinkTable";
import PageLayout from "@/components/PageLayout";

import { Project, getProject, listProjects } from "@/lib/docs";
import * as url from "@/lib/url";

export const getStaticProps: GetStaticProps<Props> = async () => {
  const projectNames = await listProjects();
  const projects = await Promise.all(
    projectNames.map(async (name) => {
      const proj = await getProject(name);
      return {
        name,
        documentation: [`${proj.metadata.summary ?? ""}`],
      };
    })
  );
  return {
    props: {
      projects,
    },
  };
};
export interface Props {
  projects: { name: string; documentation: string[] }[];
}

export default function Home({ projects }: Props) {
  return (
    <PageLayout title="py.wtf">
      <SymbolLinkTable
        title="Projects"
        url={(prj) => url.project(prj as Project)}
        symbols={projects}
        useReactRouter={false}
      />
    </PageLayout>
  );
}
