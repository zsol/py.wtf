import styled from "@emotion/styled";
import React from "react";

import { RouterLink } from "../core/navigation/Link";

const StyledRouterLink = styled(RouterLink)<{ active: string }>`
  display: flex;
  box-sizing: border-box;
  width: 100%;
  padding-left: ${(props) => props.theme.spacing.s};
  padding-right: ${(props) => props.theme.spacing.m};
  padding-bottom: ${(props) => props.theme.spacing.xxs};
  padding-top: ${(props) => props.theme.spacing.xxs};

  ${(props) =>
    props.active === "true" &&
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
  <StyledRouterLink to={href} active={(!!active || false).toString()}>
    {children}
  </StyledRouterLink>
);

export default SidebarLink;
