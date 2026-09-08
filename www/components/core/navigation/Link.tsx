import styled from "@emotion/styled";
import {
  LinkProps,
  Link as ReactRouterLink,
  createPath,
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
  return (
    <RawLink
      {...props}
      href={typeof props.to === "string" ? props.to : createPath(props.to)}
    />
  );
};
