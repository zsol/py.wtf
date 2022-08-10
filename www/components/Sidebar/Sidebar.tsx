import { Box } from "@welcome-ui/box";
import { Text } from "@welcome-ui/text";
import Link from "next/link";
import React from "react";
import styled from "styled-components";

import * as url from "@/lib/url";

import { Pkg } from "../../lib/docs";

export interface Props {
  pkg: Pkg;
  children?: React.ReactNode;
}

const Container = styled(Box)`
  overflow: auto;
  background-color: #151515;
  padding-left: ${(props) => props.theme.space.xxl};
  border-right: ${(props) => props.theme.colors.light[200]} 5px solid;
  height: 100%;
`;

export default function Sidebar({ pkg, children }: Props) {
  return (
    <Container>
      <Link href={url.pkg(pkg)}>
        <Text variant="h3" paddingRight="xl" cursor="pointer">
          Package {pkg.name}
        </Text>
      </Link>
      <Text>Version {pkg.version}</Text>
      {children}
    </Container>
  );
}
