import styled from "@emotion/styled";
import React, { ReactNode } from "react";

import { flexColumnCenter } from "./helpers";

const Container = styled.div`
  ${flexColumnCenter}

  min-height: 100vh;

  background-color: ${(props) => props.theme.colors.pageBackground.mid};

  color: ${(props) => props.theme.colors.mainText};
`;

interface Props {
  children: ReactNode;
}

export default function FullPageBackground({ children }: Props) {
  return <Container>{children}</Container>;
}
