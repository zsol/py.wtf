import { Link as WUILink } from "@welcome-ui/link";
import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";

const StyledWUILink = styled(WUILink)<{ active: boolean }>`
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

interface Props {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}

const SidebarLink = ({ children, href, active, ...rest }: Props) => (
  <Link to={href} {...rest}>
    <StyledWUILink active={active || false}>{children}</StyledWUILink>
  </Link>
);

export default SidebarLink;
