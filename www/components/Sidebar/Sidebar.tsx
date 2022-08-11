import { Box } from "@welcome-ui/box";
import { Text } from "@welcome-ui/text";
import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";

import * as url from "@/lib/url";

import { Pkg } from "../../lib/docs";

export interface Props {
  pkg: Pkg;
  children?: React.ReactNode;
}

const Container = styled(Box)`
  height: 100%;
  min-width: 15em;
  padding-left: ${(props) => props.theme.space.xxl};

  background-color: ${(props) => props.theme.colors.slate[700]};
  border-right: ${(props) => props.theme.colors.slate[200]} 10px solid;

  overflow: auto;
`;

const StyledLink = styled(Link)`
  color: ${(props) => props.theme.colors.grey[300]};
  text-decoration: none;
`;

export default function Sidebar({ pkg, children }: Props) {
  return (
    <Container color="grey.100">
      <StyledLink to={url.pkg(pkg)}>
        <Text variant="h3" paddingRight="xl" cursor="pointer">
          Package {pkg.name}
        </Text>
      </StyledLink>
      <Text>Version {pkg.version}</Text>
      {children}
    </Container>
  );
}
