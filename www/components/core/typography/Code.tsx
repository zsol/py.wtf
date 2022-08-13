import styled from "@emotion/styled";
import { ReactNode } from "react";

const CodeContainer = styled.pre`
  width: 100%;

  color: ${(props) => props.theme.colors.mainText};
  background-color: ${(props) => props.theme.colors.pageBackground.dark};
`;

const CodeContent = styled.code`
  margin: ${(props) => props.theme.spacing.m};
`;

export const Code = ({ children }: { children: ReactNode }) => (
  <CodeContainer>
    <CodeContent>{children}</CodeContent>
  </CodeContainer>
);
