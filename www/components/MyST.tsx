import { Fragment, ReactElement, useMemo } from "react";

import { DocumentationNode, MySTRole, parseDocumentation } from "@/lib/myst";

import { RawLink } from "./core/navigation/Link";

export type { MySTRole } from "@/lib/myst";

export interface MySTRoles {
  roles?: (role: MySTRole) => ReactElement;
}

export interface MySTMarkupProps extends MySTRoles {
  source: string;
}

export default function MySTMarkup({ source, roles }: MySTMarkupProps) {
  // Cache only this mounted docstring, independent of the current role resolver.
  const tree = useMemo(() => parseDocumentation(source), [source]);
  return <>{renderNodes(tree, roles)}</>;
}

function renderNodes(
  nodes: DocumentationNode[],
  roles: MySTRoles["roles"],
): ReactElement[] {
  return nodes.map((node, key) => (
    <Fragment key={key}>{renderNode(node, roles)}</Fragment>
  ));
}

function renderNode(
  node: DocumentationNode,
  roles: MySTRoles["roles"],
): ReactElement {
  switch (node.type) {
    case "text":
      return <>{node.value}</>;
    case "code":
      return <code>{node.value}</code>;
    case "codeBlock":
      return (
        <pre>
          <code>{node.value}</code>
        </pre>
      );
    case "break":
      return <br />;
    case "thematicBreak":
      return <hr />;
    case "mystRole":
      return roles ? roles(node) : <code>{node.value}</code>;
    case "link":
      return (
        <RawLink href={node.url} title={node.title}>
          {renderNodes(node.children, roles)}
        </RawLink>
      );
    case "image":
      return (
        <picture>
          <img src={node.url} alt={node.alt} title={node.title} />
        </picture>
      );
    case "element": {
      const Tag = node.tag;
      return <Tag start={node.start}>{renderNodes(node.children, roles)}</Tag>;
    }
  }
}
