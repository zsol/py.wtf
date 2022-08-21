import { ThemeProvider, css } from "@emotion/react";
import styled from "@emotion/styled";
import Head from "next/head";
import { ReactNode } from "react";

import FullPageBackground from "@/components/core/layout/FullPageBackground";
import { flexColumn, flexColumnCenter } from "@/components/core/layout/helpers";
import { Link } from "@/components/core/navigation/Link";
import { darkTheme } from "@/components/core/theme/theme";

import Header from "./Header";
import {
  FrameContent,
  FrameText,
  frameStyles,
} from "./core/layout/frameHelpers";
import { Text } from "./core/typography/Text";

const PageContainer = styled(FullPageBackground)`
  max-height: 100vh;
`;

const Footer = styled.footer`
  ${frameStyles}

  border-top: 1px solid ${(props) => props.theme.colors.footer.separator};
`;

const Content = styled.main`
  ${flexColumn}
  flex-grow: 1;
  align-items: center;

  width: 100%;
  overflow: auto;
`;

export interface Props {
  title: string;
  header?: ReactNode;
  children: ReactNode;
  showSearchInHeader?: boolean;
}

export default function PageLayout({ title, header, children }: Props) {
  return (
    <ThemeProvider theme={darkTheme}>
      <PageContainer>
        <Head>
          <title>{title}</title>
          {/*<link rel="icon" href="/favicon.ico" /> */}
        </Head>

        {header}

        <Content>{children}</Content>

        <Footer>
          <FrameContent>
            <FrameText>
              Footer™: This is a hobby project, please be gentle. Send issues{" "}
              <Link href="https://github.com/zsol/py.wtf/issues/">here</Link>.
              Bugs courtesy of{" "}
              <Link href="https://github.com/abesto">abesto</Link>,{" "}
              <Link href="https://github.com/anathien">anathien</Link>,{" "}
              <Link href="https://github.com/zsol">zsol</Link>.
            </FrameText>
          </FrameContent>
        </Footer>
      </PageContainer>
    </ThemeProvider>
  );
}
