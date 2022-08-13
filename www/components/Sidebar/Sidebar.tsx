import styled from "@emotion/styled";
import React from "react";

import * as url from "@/lib/url";

import { Project } from "../../lib/docs";
import { RouterLink } from "../core/navigation/Link";
import { H3 } from "../core/typography/Heading";
import { Text } from "../core/typography/Text";

export interface Props {
  project: Project;
  children?: React.ReactNode;
}

const Container = styled.div`
  padding: ${(props) => props.theme.spacing.s};
`;

// Note: Styles to come later
const SidebarHeader = styled.div``;
const SidebarContent = styled.div``;

export default function Sidebar({ project, children }: Props) {
  return (
    <Container>
      <SidebarHeader>
        <H3>
          <RouterLink to={url.project(project)}>
            Project {project.name}
          </RouterLink>
        </H3>
        <Text>Version {project.metadata.version}</Text>
      </SidebarHeader>
      <SidebarContent>{children}</SidebarContent>
    </Container>
  );
}
