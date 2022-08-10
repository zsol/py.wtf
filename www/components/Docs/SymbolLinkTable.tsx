import { Box } from "@welcome-ui/box";
import { Link } from "@welcome-ui/link";
import { Text } from "@welcome-ui/text";
import NextLink from "next/link";
import React from "react";
import { UrlObject } from "url";

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
  stripPrefix: string;
  symbols: T[];
  url: (sym: T) => string | UrlObject;
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
}: Props<T>) {
  if (symbols.length === 0) {
    return <></>;
  }
  return (
    <Box>
      <Text variant="h3">{title}</Text>
      <Table>
        <Table.Tbody>
          {deduplicate(symbols).map((sym) => {
            return (
              <Table.Tr key={sym.name}>
                <Table.Th>
                  <NextLink href={url(sym)} passHref>
                    <Link>{withoutPrefix(stripPrefix, sym.name)}</Link>
                  </NextLink>
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
