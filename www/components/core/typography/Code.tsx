import styled from "@emotion/styled";
import { ReactNode, useEffect, useRef, useState } from "react";

import { flexRow } from "@/components/core/layout/helpers";

const CodeAnchor = styled.div`
  a {
    color: ${(props) => props.theme.colors.code.anchor};
    text-decoration: none;
  }
`;

const CodeContainer = styled.pre<{ highlighted: boolean }>`
  ${flexRow};
  padding: ${(props) => props.theme.spacing.m};

  color: ${(props) => props.theme.colors.mainText};
  background-color: ${(props) =>
    props.highlighted
      ? props.theme.colors.code.backgroundHighlighted
      : props.theme.colors.code.background};

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

export const Code = ({ anchor, children }: Props) => {
  // Scroll to this code block if the URL hash matches its id, whenever either
  // - the URL hash changes (e.g. when the user clicks on a link)
  // - when the component mounts (e.g. when the user directly navigates to the page containing the code block)
  // This is a prime candidate for extracting into a higher-level component if it's ever needed in multiple places.
  const [highlighted, setHighlighted] = useState(false);
  const ref = useRef<HTMLPreElement>(null);
  useEffect(() => {
    if (!anchor || !ref.current) {
      return;
    }
    setHighlighted(window.location.hash === `#${anchor}`);
  }, [ref, window.location.hash]);
  useEffect(() => {
    if (ref.current && highlighted) {
      ref.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [ref, highlighted]);

  return (
    <CodeContainer ref={ref} highlighted={highlighted}>
      {(anchor && (
        <CodeAnchor id={anchor}>
          <a href={"#" + anchor}>§</a>{" "}
        </CodeAnchor>
      )) || <span>&nbsp;&nbsp;</span>}
      <CodeContent>{children}</CodeContent>
    </CodeContainer>
  );
};

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
