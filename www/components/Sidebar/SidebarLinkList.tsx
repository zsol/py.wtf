import { sortedBy } from "@/lib/sorting";
import { withoutPrefix } from "@/lib/url";

import { Text } from "../core/typography/Text";
import SidebarLink from "./SidebarLink";

interface HasName {
  name: string;
}
interface Props<T extends HasName> {
  title: string;
  stripPrefix?: string;
  items: T[];
  active?: string;
  url: (item: T) => string;
}

export default function SidebarLinkList<T extends HasName>({
  title,
  stripPrefix,
  items,
  active,
  url,
}: Props<T>) {
  if (items.length === 0) {
    return null;
  }
  return (
    <div>
      <Text>{title}</Text>
      {sortedBy(items, "name")
        .filter((x, i, xs) => i === 0 || xs[i - 1].name !== x.name)
        .map((x) => (
          <Text key={x.name}>
            <SidebarLink href={url(x)} active={x.name === active}>
              {stripPrefix ? withoutPrefix(stripPrefix, x.name) : x.name}
            </SidebarLink>
          </Text>
        ))}
    </div>
  );
}
