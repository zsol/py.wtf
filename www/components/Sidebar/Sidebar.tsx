import styled from "@emotion/styled";
import React from "react";

import * as url from "@/lib/url";

import { Project } from "../../lib/docs";
import { flexColumn } from "../core/layout/helpers";
import { Link, RawLink } from "../core/navigation/Link";
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
    <RawLink href={meta.documentation_url} target="_blank">
      <Text>📄 Docs</Text>
    </RawLink>
  );
  const home_link = meta.home_page && (
    <RawLink href={meta.home_page} target="_blank">
      <Text>🏠 Website</Text>
    </RawLink>
  );

  return (
    <Container>
      <SidebarHeader>
        <H3>
          <Link to={url.project(project)}>Project {project.name}</Link>
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
