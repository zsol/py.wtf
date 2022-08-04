import React, { ReactNode } from "react";
import { createTheme, WuiProvider } from "@welcome-ui/core";
import { darkTheme } from '@welcome-ui/themes.dark'
import { welcomeTheme } from '@welcome-ui/themes.welcome'
import { Flex } from '@welcome-ui/flex';
import { Stack } from '@welcome-ui/stack';
import { Text } from '@welcome-ui/text';
import { Box } from '@welcome-ui/box';
import { Pkg } from "../lib/docs";


export default function Layout({ title, children }: { title: string, children: ReactNode }) {
    return (
        <WuiProvider theme={darkTheme}>
            <Flex backgroundColor="light.700" color="dark.700" direction="column">
                <div className="main">
                    <Stack>
                        <Header title={title} />
                        {children}
                    </Stack>
                </div>
            </Flex>
            <style jsx>{`
            .main {
                min-height: 100vh;
            }
            `}</style>
        </WuiProvider>
    )
}

export function Header({ title }: { title: string }) {
    return (
        <Box alignItems="center" justifyContent="center" boxShadow="sm">
            <Text variant="h1" textAlign="center">{title}</Text>
        </Box>
    )
}