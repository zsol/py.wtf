import styled from "@emotion/styled";
import { Link as ReactRouterLink } from "react-router-dom";

export const Link = styled.a`
  color: ${(props) => props.theme.colors.link.default};

  &:hover {
    color: ${(props) => props.theme.colors.link.hover};
  }
`;

export const RouterLink = styled(ReactRouterLink)`
  color: ${(props) => props.theme.colors.link.default};

  &:hover {
    color: ${(props) => props.theme.colors.link.hover};
  }
`;
