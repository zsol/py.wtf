import styled from "@emotion/styled";
import { ReactNode, useEffect, useRef, useSyncExternalStore } from "react";
import { useInRouterContext, useLocation } from "react-router-dom";

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

export const Code = (props: Props) => {
  const isReactRouter = useInRouterContext();
  return isReactRouter ? <RouterCode {...props} /> : <BrowserCode {...props} />;
};

function RouterCode(props: Props) {
  // Router navigation can update the fragment without a native hashchange event.
  const { hash } = useLocation();
  return <CodeBlock {...props} hash={hash} />;
}

const subscribeToHash = (onChange: () => void) => {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
};
const getBrowserHash = () => window.location.hash;
const getServerHash = () => "";

function BrowserCode(props: Props) {
  const hash = useSyncExternalStore(
    subscribeToHash,
    getBrowserHash,
    getServerHash,
  );
  return <CodeBlock {...props} hash={hash} />;
}

function CodeBlock({ anchor, children, hash }: Props & { hash: string }) {
  // Scroll when this declaration becomes the target, including on initial load.
  const highlighted = !!anchor && hash === `#${anchor}`;
  const ref = useRef<HTMLPreElement>(null);
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
}

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
