import { ThemeProvider, css } from "@emotion/react";
import styled from "@emotion/styled";
import Head from "next/head";
import { ReactNode } from "react";

import FullPageBackground from "@/components/core/layout/FullPageBackground";
import { flexColumn, flexColumnCenter } from "@/components/core/layout/helpers";
import { Link } from "@/components/core/navigation/Link";
import { darkTheme } from "@/components/core/theme/theme";

import { Text } from "./core/typography/Text";

const PageContainer = styled(FullPageBackground)`
  max-height: 100vh;
`;

const frameStyles = css`
  ${flexColumnCenter}
  flex-shrink: 0;

  width: 100%;
  min-height: 30px;
`;

const Header = styled.header`
  ${frameStyles}

  border-bottom: 1px solid ${(props) => props.theme.colors.footer.separator};
`;

const Footer = styled.footer`
  ${frameStyles}

  border-top: 1px solid ${(props) => props.theme.colors.footer.separator};
`;

const FrameContent = styled.div`
  text-align: center;

  padding: ${(props) => props.theme.spacing.m};
`;

const FrameText = styled(Text)`
  margin: 0;
  margin-block-start: 0;
  margin-block-end: 0;
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
  children: ReactNode;
}

export default function PageLayout({ title, children }: Props) {
  return (
    <ThemeProvider theme={darkTheme}>
      <PageContainer>
        <Head>
          <title>{title}</title>
          {/*<link rel="icon" href="/favicon.ico" /> */}
        </Head>

        <Header>
          <FrameContent>
            <FrameText>Python. Wabbajack Theatrical Fantasy</FrameText>
          </FrameContent>
        </Header>
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
