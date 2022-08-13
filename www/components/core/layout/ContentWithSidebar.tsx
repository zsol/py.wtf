import styled from "@emotion/styled";
import React, { ReactNode } from "react";

import { flexColumn, flexRow } from "./helpers";

interface Props {
  children: ReactNode;
  sidebar: ReactNode;
}

const Container = styled.div`
  ${flexRow}

  height: 100vh;
`;

const SidebarContainer = styled.div`
  width: 100%;
  max-width: 15em;
  overflow: auto;

  background-color: ${(props) => props.theme.colors.pageBackground.dark};
  border-right: 10px solid ${(props) => props.theme.colors.pageBackground.light};
`;

const ContentContainer = styled.div`
  ${flexColumn}

  width: 100%;
  overflow: auto;

  background-color: ${(props) => props.theme.colors.pageBackground.mid};
`;

export default function ContentWithSidebar({ sidebar, children }: Props) {
  return (
    <Container>
      <SidebarContainer>{sidebar}</SidebarContainer>
      <ContentContainer>{children}</ContentContainer>
    </Container>
  );
}
