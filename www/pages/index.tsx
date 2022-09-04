import styled from "@emotion/styled";
import { GetStaticProps } from "next";

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

import { Project, ProjectMetadata, getIndexMetadata } from "@/lib/docs";
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
  @media screen and (max-width: 500px) {
    flex-direction: column;
    align-items: center;
  }
  justify-content: center;
`;

const ProjectTableWrapper = styled.div`
  max-width: 50%;
`;

function ProjectTable<T extends Sym>(props: SymbolLinkTableProps<T>) {
  return (
    <ProjectTableWrapper>
      <SymbolLinkTable {...props} />
    </ProjectTableWrapper>
  );
}

const TimestampFooter = styled.div`
  ${flexColumnCenter}
  padding-top: ${(props) => props.theme.spacing.xl};
  color: ${(props) => props.theme.colors.footer.text};
`;

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
            useReactRouter={false}
          />
          <ProjectTable
            title="Recent Projects"
            symbols={recentProjects}
            url={(prj) => url.project(prj as Project)}
            useReactRouter={false}
          />
        </ProjectTables>
        <TimestampFooter>
          Generated on {humanizeTime(generatedAt)}
        </TimestampFooter>
      </ProjectContainer>
    </PageLayout>
  );
}
