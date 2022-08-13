import styled from "@emotion/styled";
import React from "react";

import * as url from "@/lib/url";

import { Project } from "../../lib/docs";
import { flexColumn } from "../core/layout/helpers";
import { Link, RouterLink } from "../core/navigation/Link";
import { H3 } from "../core/typography/Heading";
import { Text } from "../core/typography/Text";

export interface Props {
  project: Project;
  children?: React.ReactNode;
}

const Container = styled.div`
  padding: ${(props) => props.theme.spacing.s};
`;

const LinkContainer = styled.div`
  ${flexColumn}
`;

// Note: Styles to come later
const SidebarHeader = styled.div``;
const SidebarContent = styled.div``;

export default function Sidebar({ project, children }: Props) {
  const meta = project.metadata;
  const docs_url = meta.documentation_url && (
    <Link href={meta.documentation_url} target="_blank">
      <Text>📄 Docs</Text>
    </Link>
  );
  const home_link = meta.home_page && (
    <Link href={meta.home_page} target="_blank">
      <Text>🏠 Website</Text>
    </Link>
  );

  return (
    <Container>
      <SidebarHeader>
        <H3>
          <RouterLink to={url.project(project)}>
            Project {project.name}
          </RouterLink>
        </H3>
        <LinkContainer>
          {home_link}
          {docs_url}
        </LinkContainer>
        <Text>Version {project.metadata.version}</Text>
      </SidebarHeader>
      <SidebarContent>{children}</SidebarContent>
    </Container>
  );
}
