import styled from "@emotion/styled";
import { GetStaticProps } from "next";
import useSWR from "swr";

import SymbolLinkTable, {
  Sym,
  SymbolLinkTableProps,
} from "@/components/Docs/SymbolLinkTable";
import Header from "@/components/Header";
import PageLayout from "@/components/PageLayout";
import { Search } from "@/components/core/Search";
import {
  flexColumn,
  flexColumnCenter,
  flexRow,
} from "@/components/core/layout/helpers";

import {
  IndexMetadata,
  Project,
  ProjectMetadata,
  getIndexMetadata,
} from "@/lib/docs";
import {
  SearchDescriptor,
  SymbolType,
  makeIndex,
} from "@/lib/searchDescriptor";
import * as url from "@/lib/url";

const ProjectContainer = styled.div`
  ${flexColumn}
  margin-top: auto;
  margin-bottom: auto;
`;

const SearchContainer = styled.div`
  margin: ${(props) => props.theme.spacing.xl};
  min-width: 40vw;
`;

const ProjectTables = styled.div`
  ${flexRow}
  // TODO: move this into the theme's breakpoints once they exist
  @media screen and (max-width: 500px) {
    ${flexColumnCenter}
  }
  justify-content: center;
`;

const ProjectTableWrapper = styled.div`
  max-width: 50%;
`;

const TimestampFooter = styled.div`
  ${flexColumnCenter}
  padding-top: ${(props) => props.theme.spacing.xl};
  color: ${(props) => props.theme.colors.footer.text};
`;

function ProjectTable<T extends Sym>(props: SymbolLinkTableProps<T>) {
  return (
    <ProjectTableWrapper>
      <SymbolLinkTable {...props} />
    </ProjectTableWrapper>
  );
}

interface ProjectSymbol {
  name: string;
  documentation: string[];
}

export interface Props {
  topProjects: ProjectSymbol[];
  recentProjects: ProjectSymbol[];
  descriptors: SearchDescriptor[];
  generatedAt: number;
}

const metadataToSymbol = (prj: ProjectMetadata) => ({
  documentation: [prj.summary ?? ""],
  ...prj,
});

export const getStaticProps: GetStaticProps<Props> = async () => {
  const metadata = await getIndexMetadata();
  const projectNames = metadata.all_project_names;
  const descriptors = projectNames.map((name) => ({
    name,
    fqname: name,
    type: "project" as SymbolType,
    url: url.project({ name } as Project),
  }));
  return {
    props: {
      topProjects: metadata.top_projects.map(metadataToSymbol),
      recentProjects: metadata.latest_projects.map(metadataToSymbol),
      descriptors,
      generatedAt: metadata.generated_at,
    },
  };
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function useHomeData() {
  const { data, error } = useSWR<IndexMetadata, Error>(
    url.indexMetadata(),
    fetcher,
  );

  const props: Props | undefined = data
    ? {
        topProjects: data.top_projects.map(metadataToSymbol),
        recentProjects: data.latest_projects.map(metadataToSymbol),
        descriptors: data.all_project_names.map((name: string) => ({
          name,
          fqname: name,
          type: "project" as SymbolType,
          url: url.project({ name } as Project),
        })),
        generatedAt: data.generated_at,
      }
    : undefined;

  return {
    data: props,
    isLoading: !error && !data,
    error,
  };
}

function humanizeTime(timestamp: number) {
  const dt = new Intl.DateTimeFormat(undefined, {
    timeStyle: "long",
    dateStyle: "long",
  });
  return dt.format(timestamp * 1000);
}

export default function Home({
  topProjects,
  recentProjects,
  descriptors,
  generatedAt,
}: Props) {
  const { data, isLoading, error } = useHomeData();
  if (!isLoading) {
    if (error) {
      console.error(error);
    } else if (data) {
      topProjects = data.topProjects;
      recentProjects = data.recentProjects;
      descriptors = data.descriptors;
      generatedAt = data.generatedAt;
    } else {
      console.error("No data");
    }
  }
  return (
    <PageLayout title="py.wtf" header={<Header showSearch={false} />}>
      <ProjectContainer>
        <SearchContainer>
          <Search descriptors={makeIndex(descriptors)} />
        </SearchContainer>
        <ProjectTables>
          <ProjectTable
            title="Top Projects"
            symbols={topProjects}
            url={(prj) => url.project(prj as Project)}
          />
          <ProjectTable
            title="Recent Projects"
            symbols={recentProjects}
            url={(prj) => url.project(prj as Project)}
          />
        </ProjectTables>
        <TimestampFooter>
          Generated on {humanizeTime(generatedAt)}
        </TimestampFooter>
      </ProjectContainer>
    </PageLayout>
  );
}
