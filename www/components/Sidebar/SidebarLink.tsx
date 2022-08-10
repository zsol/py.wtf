import { Link } from "@welcome-ui/link";
import NextLink, { LinkProps } from "next/link";
import React from "react";
import styled from "styled-components";

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

interface Props extends LinkProps {
  children: React.ReactNode;
  active?: boolean;
}

const SidebarLink = ({ children, href, active, ...rest }: Props) => (
  <NextLink href={href} passHref {...rest}>
    <StyledWUILink active={active || false}>{children}</StyledWUILink>
  </NextLink>
);

export default SidebarLink;
