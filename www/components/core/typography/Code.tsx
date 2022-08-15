import styled from "@emotion/styled";
import { ReactNode } from "react";

import { flexRow } from "@/components/core/layout/helpers";

const CodeAnchor = styled.div`
  a {
    color: ${(props) => props.theme.colors.code.anchor};
    text-decoration: none;
  }
`;

const CodeContainer = styled.pre`
  ${flexRow};
  width: 100%;
  padding: ${(props) => props.theme.spacing.m};

  color: ${(props) => props.theme.colors.mainText};
  background-color: ${(props) => props.theme.colors.code.background};

  ${CodeAnchor} {
    visibility: hidden;
  }
  &:hover ${CodeAnchor} {
    visibility: visible;
  }
`;

const CodeContent = styled.code`
  display: block;
`;

interface Props {
  anchor?: string;
  children: ReactNode;
}

export const Code = ({ anchor, children }: Props) => (
  <CodeContainer>
    {(anchor && (
      <CodeAnchor id={anchor}>
        <a href={"#" + anchor}>§</a>{" "}
      </CodeAnchor>
    )) || <span>&nbsp;&nbsp;</span>}
    <CodeContent>{children}</CodeContent>
  </CodeContainer>
);

export const dedupAnchors = () => {
  const seen = new Set<string>();
  return (name: string) => {
    if (seen.has(name)) {
      return undefined;
    }
    seen.add(name);
    return name;
  };
};
