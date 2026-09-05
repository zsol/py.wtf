import styled from "@emotion/styled";
import { Fragment, ReactElement, useId, useMemo } from "react";

import {
  DocumentationNode,
  DocumentationProfile,
  MySTRole,
  documentationURL,
  parseDocumentation,
  parseDocumentationInline,
} from "@/lib/myst";

import MySTMath from "./MySTMath";
import { RawLink } from "./core/navigation/Link";

export type { MySTRole } from "@/lib/myst";
export interface MySTRoles {
  roles?: (role: MySTRole) => ReactElement;
}
export interface MySTMarkupProps extends MySTRoles {
  source: string;
  profile?: DocumentationProfile;
}
interface RenderContext extends MySTRoles {
  prefix: string;
  footnotePrefix: string;
  directiveScopes: Map<DirectiveNode, string>;
  targets: Set<string>;
  profile: DocumentationProfile;
}
const normalizeLabel = (label: string) =>
  label.trim().toLowerCase().replace(/\s+/g, " ");
const targetId = (context: RenderContext, label: string) =>
  `${context.prefix}-target-${normalizeLabel(label)}`;
const DirectiveCode = styled.code`
  .code-line[data-line-number]::before {
    content: attr(data-line-number);
    display: inline-block;
    min-width: 3em;
    padding-right: 1em;
    opacity: 0.6;
    user-select: none;
  }
`;

export default function MySTMarkup({
  source,
  roles,
  profile = "myst",
}: MySTMarkupProps) {
  const tree = useMemo(
    () => parseDocumentation(source, profile),
    [source, profile],
  );
  const prefix = useId();
  const targets = new Set<string>();
  const directiveScopes = new Map<DirectiveNode, string>();
  function collect(nodes: DocumentationNode[]) {
    for (const node of nodes) {
      if (node.type === "target") targets.add(normalizeLabel(node.value));
      if (node.type === "math" && node.label)
        targets.add(normalizeLabel(node.label));
      if (node.type === "directive") {
        directiveScopes.set(
          node,
          `${prefix}-directive-${directiveScopes.size}`,
        );
        const name = node.options.name ?? node.options.label;
        if (typeof name === "string") targets.add(normalizeLabel(name));
      }
      if ("children" in node) collect(node.children ?? []);
    }
  }
  collect(tree);
  return (
    <>
      {renderNodes(tree, {
        roles,
        prefix,
        footnotePrefix: prefix,
        directiveScopes,
        targets,
        profile,
      })}
    </>
  );
}

function renderNodes(
  nodes: DocumentationNode[],
  context: RenderContext,
): ReactElement[] {
  return nodes.map((node, key) => (
    <Fragment key={key}>{renderNode(node, context)}</Fragment>
  ));
}

function roleNode(node: MySTRole, context: RenderContext): ReactElement {
  const text = node.value;
  switch (node.name) {
    case "code":
    case "literal":
    case "raw":
      return <code>{text}</code>;
    case "emphasis":
      return <em>{text}</em>;
    case "strong":
      return <strong>{text}</strong>;
    case "sub":
    case "subscript":
      return <sub>{text}</sub>;
    case "sup":
    case "superscript":
      return <sup>{text}</sup>;
    case "math":
      return <MySTMath value={text} display={false} />;
    case "abbr":
    case "abbreviation": {
      const match = /^(.+?)\(([^()]+)\)$/.exec(text);
      return (
        <abbr title={match?.[2].trim()}>{(match?.[1] ?? text).trim()}</abbr>
      );
    }
    case "eq":
    case "ref": {
      const match = /^(.*?)\s*<([^<>]+)>$/.exec(text);
      const label = match?.[2] ?? text;
      if (context.targets.has(normalizeLabel(label)))
        return (
          <RawLink href={`#${encodeURIComponent(targetId(context, label))}`}>
            {match?.[1] ?? text}
          </RawLink>
        );
    }
  }
  if (context.roles) return context.roles(node);
  // MyST's generic-role fixture specifies an explicit unhandled wrapper that
  // preserves both the kind and content, rather than silently dropping them.
  return (
    <span className="role unhandled">
      <code className="kind">{`{${node.name}}`}</code>
      <code>{text}</code>
    </span>
  );
}

type DirectiveNode = Extract<DocumentationNode, { type: "directive" }>;
function unresolvedDirective(node: DirectiveNode, error = node.error) {
  return (
    <div className="directive unhandled">
      <p>
        <code className="kind">{`{${node.name}}`}</code>
        {node.args && <code className="args">{node.args}</code>}
      </p>
      {error && <p>{error}</p>}
      <pre>
        <code>{node.raw}</code>
      </pre>
    </div>
  );
}
const admonitions = new Set([
  "admonition",
  "attention",
  "caution",
  "danger",
  "error",
  "hint",
  "important",
  "note",
  "tip",
  "warning",
  "seealso",
]);
function directiveNode(
  node: DirectiveNode,
  parentContext: RenderContext,
): ReactElement {
  const context = {
    ...parentContext,
    footnotePrefix:
      parentContext.directiveScopes.get(node) ?? parentContext.footnotePrefix,
  };
  if (node.error) return unresolvedDirective(node);
  const name = node.options.name ?? node.options.label;
  const id = typeof name === "string" ? targetId(context, name) : undefined;
  const inline = (value: string) =>
    renderNodes(parseDocumentationInline(value), context);
  if (admonitions.has(node.name)) {
    const title =
      node.name === "admonition"
        ? node.args
        : node.name === "seealso"
          ? "See Also"
          : node.name[0].toUpperCase() + node.name.slice(1);
    if (!title) return unresolvedDirective(node, "Admonition requires a title");
    return (
      <aside
        id={id}
        className={[
          node.options.class,
          "admonition",
          node.name === "admonition" ? "" : node.name,
        ]
          .filter((v) => typeof v === "string" && v)
          .join(" ")}
      >
        <p className="admonition-title">{inline(title)}</p>
        {renderNodes(node.children ?? [], context)}
      </aside>
    );
  }
  if (["code", "code-block", "code-cell"].includes(node.name)) {
    const first =
      node.options["number-lines"] ?? node.options["lineno-start"] ?? 1;
    const start = Number(first);
    if (!Number.isSafeInteger(start) || start < 1)
      return unresolvedDirective(node, "Invalid starting line number");
    const numbered = ["number-lines", "lineno-start", "linenos"].some(
      (key) => key in node.options,
    );
    const emphasize = new Set<number>();
    if (node.options["emphasize-lines"] !== undefined) {
      const option = node.options["emphasize-lines"];
      if (typeof option !== "number" && typeof option !== "string")
        return unresolvedDirective(node, "Invalid emphasize-lines");
      const parts = String(option).split(",");
      for (const part of parts) {
        const match = /^\s*(\d+)(?:-(\d+))?\s*$/.exec(part);
        if (!match) return unresolvedDirective(node, "Invalid emphasize-lines");
        const from = Number(match[1]),
          to = Number(match[2] ?? match[1]);
        if (from < 1 || to < from || to > node.value.split("\n").length)
          return unresolvedDirective(node, "Invalid emphasize-lines range");
        for (let line = from; line <= to; line++) emphasize.add(line);
      }
    }
    const lines = node.value.split("\n");
    const code = (
      <pre id={id}>
        <DirectiveCode
          className={
            [
              node.args ? `language-${node.args.split(/\s+/)[0]}` : "",
              node.options.class,
            ]
              .filter((v) => typeof v === "string" && v)
              .join(" ") || undefined
          }
        >
          {numbered || emphasize.size
            ? lines.map((line, index) => (
                <span
                  className="code-line"
                  data-line-number={numbered ? start + index : undefined}
                  key={index}
                >
                  {emphasize.has(index + 1) ? <mark>{line}</mark> : line}
                  {index + 1 < lines.length ? "\n" : ""}
                </span>
              ))
            : node.value}
        </DirectiveCode>
      </pre>
    );
    const caption = node.options.caption;
    return typeof caption === "string" ? (
      <figure>
        <figcaption>{inline(caption)}</figcaption>
        {code}
      </figure>
    ) : (
      code
    );
  }
  if (node.name === "math") {
    return (
      <div id={id}>
        <MySTMath
          value={[node.args, node.value].filter(Boolean).join("\n")}
          display
        />
      </div>
    );
  }
  if (node.name === "image" || node.name === "figure") {
    const url = documentationURL(node.args);
    if (!url) return unresolvedDirective(node, "Invalid image URL");
    const alt = typeof node.options.alt === "string" ? node.options.alt : "";
    const dimension = (key: "width" | "height") => {
      const value = node.options[key];
      return typeof value === "number" && value >= 0
        ? `${value}px`
        : typeof value === "string" &&
            /^\d+(?:\.\d+)?(?:px|em|rem|%|cm|mm|in|pt|pc)?$/.test(value)
          ? /^\d+(?:\.\d+)?$/.test(value)
            ? `${value}px`
            : value
          : undefined;
    };
    const width = dimension("width"),
      height = dimension("height");
    if (
      ("width" in node.options && !width) ||
      ("height" in node.options && !height)
    )
      return unresolvedDirective(node, "Invalid image dimensions");
    const align = node.options.align;
    if (
      align !== undefined &&
      (typeof align !== "string" ||
        !["left", "center", "right"].includes(align))
    )
      return unresolvedDirective(node, "Invalid image alignment");
    const picture = (
      <picture>
        <img
          src={url}
          alt={alt}
          className={
            [
              typeof align === "string" ? `align-${align}` : "",
              node.options.class,
            ]
              .filter((v) => typeof v === "string" && v)
              .join(" ") || undefined
          }
          style={{
            width,
            height,
            display: align ? "block" : undefined,
            marginLeft:
              align === "center" || align === "right" ? "auto" : undefined,
            marginRight:
              align === "center" || align === "left" ? "auto" : undefined,
          }}
        />
      </picture>
    );
    return node.name === "figure" ? (
      <figure id={id}>
        {picture}
        {node.children?.length ? (
          <figcaption>
            {renderNodes(node.children.slice(0, 1), context)}
          </figcaption>
        ) : null}
        {(node.children?.length ?? 0) > 1 && (
          <div className="legend">
            {renderNodes(node.children!.slice(1), context)}
          </div>
        )}
      </figure>
    ) : (
      <span id={id}>{picture}</span>
    );
  }
  if (node.name === "table") {
    return (
      <figure id={id}>
        {node.args && <figcaption>{inline(node.args)}</figcaption>}
        {renderNodes(node.children ?? [], context)}
      </figure>
    );
  }
  if (node.name === "list-table") {
    const outer = node.children?.[0];
    if (
      node.children?.length !== 1 ||
      outer?.type !== "element" ||
      outer.tag !== "ul"
    )
      return unresolvedDirective(
        node,
        "A list-table requires a nested bullet list",
      );
    const rows: DocumentationNode[][][] = [];
    for (const item of outer.children) {
      if (
        item.type !== "element" ||
        item.tag !== "li" ||
        item.children.length !== 1
      )
        return unresolvedDirective(node, "Invalid list-table row");
      const list = item.children[0];
      if (list.type !== "element" || list.tag !== "ul")
        return unresolvedDirective(node, "Invalid list-table cells");
      const cells: DocumentationNode[][] = [];
      for (const cell of list.children) {
        if (cell.type !== "element" || cell.tag !== "li")
          return unresolvedDirective(node, "Invalid list-table cell");
        cells.push(cell.children);
      }
      if (rows.length && rows[0].length !== cells.length)
        return unresolvedDirective(
          node,
          "List-table rows must have the same number of cells",
        );
      rows.push(cells);
    }
    const headers = Number(node.options["header-rows"] ?? 0);
    if (!Number.isInteger(headers) || headers < 0 || headers > rows.length)
      return unresolvedDirective(node, "Invalid list-table header-rows");
    const renderRows = (subset: DocumentationNode[][][], header: boolean) =>
      subset.map((row, index) => (
        <tr key={index}>
          {row.map((cell, col) =>
            header ? (
              <th key={col}>{renderNodes(cell, context)}</th>
            ) : (
              <td key={col}>{renderNodes(cell, context)}</td>
            ),
          )}
        </tr>
      ));
    return (
      <figure id={id}>
        {node.args && <figcaption>{inline(node.args)}</figcaption>}
        <table>
          {headers > 0 && (
            <thead>{renderRows(rows.slice(0, headers), true)}</thead>
          )}
          <tbody>{renderRows(rows.slice(headers), false)}</tbody>
        </table>
      </figure>
    );
  }
  return unresolvedDirective(node);
}

function renderNode(
  node: DocumentationNode,
  context: RenderContext,
): ReactElement {
  switch (node.type) {
    case "text":
      return <>{node.value}</>;
    case "code":
      return <code>{node.value}</code>;
    case "codeBlock":
      return (
        <pre>
          <code
            className={node.language ? `language-${node.language}` : undefined}
          >
            {node.value}
            {context.profile === "commonmark" && node.trailingNewline
              ? "\n"
              : ""}
          </code>
        </pre>
      );
    case "break":
      return <br />;
    case "thematicBreak":
      return <hr />;
    case "html":
    case "comment":
    case "blockBreak":
      return <></>;
    case "target":
      return <span id={targetId(context, node.value)} />;
    case "checkbox":
      return <input type="checkbox" disabled checked={node.checked} readOnly />;
    case "math":
      return (
        <span id={node.label ? targetId(context, node.label) : undefined}>
          <MySTMath value={node.value} display={node.display} />
        </span>
      );
    case "directive":
      return directiveNode(node, context);
    case "mystRole":
      return roleNode(node, context);
    case "footnotes":
      return (
        <section className="footnotes" aria-label="Footnotes">
          <ol>{renderNodes(node.children, context)}</ol>
        </section>
      );
    case "footnote":
      return (
        <li id={`${context.footnotePrefix}-fn-${node.id}`}>
          {renderNodes(node.children, context)}
        </li>
      );
    case "footnoteReference":
      return (
        <sup>
          <RawLink
            href={`#${encodeURIComponent(`${context.footnotePrefix}-fn-${node.id}`)}`}
            id={`${context.footnotePrefix}-fnref-${node.id}-${node.subId}`}
          >
            {node.id + 1}
          </RawLink>
        </sup>
      );
    case "footnoteBackref":
      return (
        <RawLink
          href={`#${encodeURIComponent(`${context.footnotePrefix}-fnref-${node.id}-${node.subId}`)}`}
          aria-label="Back to content"
        >
          ↩
        </RawLink>
      );
    case "link": {
      let href = documentationURL(node.url);
      if (href === undefined) return <>{renderNodes(node.children, context)}</>;
      if (href.startsWith("#")) {
        try {
          const label = decodeURIComponent(href.slice(1));
          if (context.targets.has(normalizeLabel(label)))
            href = `#${encodeURIComponent(targetId(context, label))}`;
        } catch {
          /* Keep malformed percent escapes literal. */
        }
      }
      return (
        <RawLink href={href} title={node.title}>
          {renderNodes(node.children, context)}
        </RawLink>
      );
    }
    case "image":
      return (
        <picture>
          <img
            src={documentationURL(node.url)}
            alt={node.alt}
            title={node.title}
          />
        </picture>
      );
    case "element": {
      const Tag = node.tag;
      return (
        <Tag
          start={node.start}
          style={node.align ? { textAlign: node.align } : undefined}
        >
          {renderNodes(node.children, context)}
        </Tag>
      );
    }
  }
}
