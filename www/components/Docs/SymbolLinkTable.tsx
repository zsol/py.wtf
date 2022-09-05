import { sortedBy } from "@/lib/sorting";
import { withoutPrefix } from "@/lib/url";

import { TBody, Table, Td, Tr } from "../core/layout/CondensedTable";
import { Link } from "../core/navigation/Link";
import { H3 } from "../core/typography/Heading";
import Documentation from "./Documentation";

export interface Sym {
  name: string;
  documentation: string[];
}

export interface SymbolLinkTableProps<T extends Sym> {
  title: string;
  stripPrefix?: string;
  symbols: T[];
  url: (sym: T) => string;
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
}: SymbolLinkTableProps<T>) {
  if (symbols.length === 0) {
    return null;
  }

  return (
    <div>
      <H3>{title}</H3>
      <Table>
        <TBody>
          {deduplicate(symbols).map((sym) => {
            const linkText = stripPrefix
              ? withoutPrefix(stripPrefix, sym.name)
              : sym.name;

            return (
              <Tr key={sym.name}>
                <Td>
                  <Link to={url(sym)}>{linkText}</Link>
                </Td>
                <Td>
                  <Documentation.Short>{sym.documentation}</Documentation.Short>
                </Td>
              </Tr>
            );
          })}
        </TBody>
      </Table>
    </div>
  );
}
