import React, { ReactNode } from "react";
import { createTheme, WuiProvider } from "@welcome-ui/core";
import { darkTheme } from "@welcome-ui/themes.dark";
import { Flex } from "@welcome-ui/flex";
import { Stack } from "@welcome-ui/stack";
import { Text } from "@welcome-ui/text";
import { Box } from "@welcome-ui/box";
import { Pkg } from "../lib/docs";
import styled from "styled-components";

const theme = createTheme(darkTheme);

interface Props {
  title: string;
  children: ReactNode;
  sidebar?: ReactNode;
}

const Sidebar = styled.div`
  overflow: auto;
  background-color: #151515;
  padding-left: ${(props) => props.theme.space.xxl};
  border-right: ${(props) => props.theme.colors.light[200]} 5px solid;
  height: 100%;
`;

export default function Layout({ title, sidebar, children }: Props) {
  return (
    <WuiProvider theme={theme}>
      <Flex backgroundColor="light.700" color="dark.700" direction="column">
        <Stack direction="row" minHeight="100vh">
          {sidebar && <Sidebar>{sidebar}</Sidebar>}
          <Box marginLeft="md">
            <Header title={title} />
            {children}
          </Box>
        </Stack>
      </Flex>
    </WuiProvider>
  );
}

export function Header({ title }: { title: string }) {
  return (
    <Box alignItems="center" justifyContent="center" boxShadow="sm">
      <Text variant="h1" textAlign="center">
        {title}
      </Text>
    </Box>
  );
}
