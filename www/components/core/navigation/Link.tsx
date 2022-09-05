import styled from "@emotion/styled";
import {
  LinkProps,
  Link as ReactRouterLink,
  useInRouterContext,
} from "react-router-dom";

export const RawLink = styled.a`
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

export const Link = (props: LinkProps) => {
  const isReactRouter = useInRouterContext();
  if (isReactRouter) {
    return <RouterLink {...props} />;
  }
  return <RawLink {...props} href={props.to.toString()} />;
};
