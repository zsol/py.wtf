import styled from "@emotion/styled";
import { ReactNode } from "react";

const CodeContainer = styled.pre`
  width: 100%;
  padding-top: ${(props) => props.theme.spacing.m};
  padding-bottom: ${(props) => props.theme.spacing.m};

  color: ${(props) => props.theme.colors.mainText};
  background-color: ${(props) => props.theme.colors.pageBackground.dark};
`;

const CodeContent = styled.code`
  display: block;
  padding-left: ${(props) => props.theme.spacing.m};
  padding-right: ${(props) => props.theme.spacing.m};
`;

export const Code = ({ children }: { children: ReactNode }) => (
  <CodeContainer>
    <CodeContent>{children}</CodeContent>
  </CodeContainer>
);
