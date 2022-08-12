import { Box } from "@welcome-ui/box";
import { Link as WUILink } from "@welcome-ui/link";
import { Text } from "@welcome-ui/text";
import React from "react";
import { Link as RouterLink } from "react-router-dom";
import NextLink from "next/link";

import Table from "@/components/CondensedTable";

import { sortedBy } from "@/lib/sorting";
import { withoutPrefix } from "@/lib/url";

import Documentation from "./Documentation";

export interface Sym {
  name: string;
  documentation: string[];
}

interface Props<T extends Sym> {
  title: string;
  stripPrefix?: string;
  symbols: T[];
  url: (sym: T) => string;
  useReactRouter: boolean;
}

function deduplicate<T extends Sym>(xs: T[]): T[] {
  return sortedBy(xs, "name", "documentation")
    .reverse()
    .filter((x, i, xs) => {
      return i === 0 || x.name !== xs[i - 1].name;
    })
    .reverse();
}

export default function SymbolLinkTable<T extends Sym>({
  title,
  stripPrefix,
  symbols,
  url,
  useReactRouter = true,
}: Props<T>) {
  if (symbols.length === 0) {
    return <></>;
  }
  const Link = ({ to, children }) =>
    useReactRouter ? (
      <RouterLink to={to}>{children}</RouterLink>
    ) : (
      <NextLink href={to}>{children}</NextLink>
    );
  return (
    <Box>
      <Text variant="h3">{title}</Text>
      <Table>
        <Table.Tbody>
          {deduplicate(symbols).map((sym) => {
            return (
              <Table.Tr key={sym.name}>
                <Table.Th>
                  <Link to={url(sym)}>
                    <WUILink>
                      {stripPrefix
                        ? withoutPrefix(stripPrefix, sym.name)
                        : sym.name}
                    </WUILink>
                  </Link>
                </Table.Th>
                <Table.Td>
                  <Documentation.Short>{sym.documentation}</Documentation.Short>
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Box>
  );
}
