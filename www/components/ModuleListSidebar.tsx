import React from "react";

import NextLink from "next/link";
import { Box } from "@welcome-ui/box";
import { Text } from "@welcome-ui/text";
import { Link } from "@welcome-ui/link";
import styled from "styled-components";

import { Pkg } from "../lib/docs";

const StyledWUILink = styled(Link)<{ active: boolean }>`
  padding-left: ${(props) => props.theme.space.xs};
  padding-right: ${(props) => props.theme.space.md};
  width: 100%;
  ${(props) =>
    props.active &&
    `
    background-color: ${props.theme.colors.light["500"]};
    font-weight: bold;
    color: ${props.theme.colors.dark["900"]};
  `}
`;

const ModuleLink = ({ children, href, active, ...rest }) => (
  <NextLink href={href} passHref {...rest}>
    <StyledWUILink active={active}>{children}</StyledWUILink>
  </NextLink>
);

interface ModuleListSidebarProps {
  pkg: Pkg;
  currentModule: string | undefined;
}

export default function ModuleListSidebar({
  pkg,
  currentModule,
}: ModuleListSidebarProps) {
  return (
    <Box>
      <Text variant="h3">Modules</Text>
      {pkg.modules.map((mod) => (
        <Text key={mod.name}>
          <ModuleLink
            key={mod.name}
            href={`/${pkg.name}/${mod.name}`}
            active={mod.name === currentModule}
          >
            {mod.name}
          </ModuleLink>
        </Text>
      ))}
    </Box>
  );
}
