import { Box } from "@welcome-ui/box";
import { Text } from "@welcome-ui/text";
import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";

import * as url from "@/lib/url";

import { Project } from "../../lib/docs";

export interface Props {
  project: Project;
  children?: React.ReactNode;
}

const Container = styled(Box)`
  overflow: auto;
  background-color: #151515;
  padding-left: ${(props) => props.theme.space.xxl};
  border-right: ${(props) => props.theme.colors.light[200]} 5px solid;
  height: 100%;
`;

const StyledLink = styled(Link)`
  color: ${(props) => props.theme.colors.dark[800]};
  text-decoration: none;
`;

export default function Sidebar({ project, children }: Props) {
  return (
    <Container>
      <StyledLink to={url.project(project)}>
        <Text variant="h3" paddingRight="xl" cursor="pointer">
          Project {project.name}
        </Text>
      </StyledLink>
      <Text>Version {project.metadata.version}</Text>
      {children}
    </Container>
  );
}
