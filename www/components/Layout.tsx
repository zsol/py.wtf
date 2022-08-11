import { Box } from "@welcome-ui/box";
import { Flex } from "@welcome-ui/flex";
import { Stack } from "@welcome-ui/stack";
import React, { ReactNode } from "react";

import { Pkg } from "@/lib/docs";

import Sidebar from "./Sidebar/Sidebar";

interface Props {
  pkg: Pkg;
  children: ReactNode;
  sidebar?: ReactNode;
}

export default function Layout({ pkg, sidebar, children }: Props) {
  return (
    <Flex backgroundColor="slate.500" color="grey.300" direction="column">
      <Stack direction="row" minHeight="100vh">
        <Sidebar pkg={pkg}>{sidebar}</Sidebar>
        <Box backgroundColor="slate.500" marginLeft="md" maxWidth="80em">
          {children}
        </Box>
      </Stack>
    </Flex>
  );
}
