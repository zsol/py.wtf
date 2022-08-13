import styled from "@emotion/styled";
import React from "react";

import { RouterLink } from "../core/navigation/Link";

const StyledRouterLink = styled(RouterLink)<{ active: boolean }>`
  padding-left: ${(props) => props.theme.spacing.s};
  padding-right: ${(props) => props.theme.spacing.m};
  width: 100%;
  ${(props) =>
    props.active &&
    `
    background-color: ${props.theme.colors.sidebar.highlight};
    font-weight: bold;
    color: ${props.theme.colors.link.default};
  `}
`;

interface Props {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}

const SidebarLink = ({ children, href, active }: Props) => (
  <StyledRouterLink to={href} active={active || false}>
    {children}
  </StyledRouterLink>
);

export default SidebarLink;
