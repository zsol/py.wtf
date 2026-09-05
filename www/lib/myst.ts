import MarkdownIt from "markdown-it";
import definitionLists from "markdown-it-deflist";
import footnotes from "markdown-it-footnote";

import { type DirectiveHeader, directiveHeader } from "./myst-directives";
import { mystBlocks, mystMath } from "./myst-extensions";

export interface MySTRole {
  type: "mystRole";
  name: string;
  value: string;
}

type ContainerTag =
  | "p"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "blockquote"
  | "ul"
  | "ol"
  | "li"
  | "em"
  | "strong"
  | "s"
  | "table"
  | "thead"
  | "tbody"
  | "tr"
  | "th"
  | "td"
  | "dl"
  | "dt"
  | "dd";

export type DocumentationNode =
  | MySTRole
  | { type: "html"; value: string }
  | { type: "comment"; value: string }
  | { type: "target"; value: string }
  | { type: "blockBreak"; value: string }
  | { type: "checkbox"; checked: boolean }
  | { type: "math"; value: string; display: boolean; label?: string }
  | { type: "footnotes"; children: DocumentationNode[] }
  | {
      type: "footnote";
      id: number;
      label: string;
      children: DocumentationNode[];
    }
  | {
      type: "footnoteReference" | "footnoteBackref";
      id: number;
      subId: number;
      label: string;
    }
  | (DirectiveHeader & { type: "directive"; children?: DocumentationNode[] })
  | { type: "text" | "code"; value: string }
  | {
      type: "codeBlock";
      value: string;
      trailingNewline: boolean;
      language?: string;
    }
  | { type: "break" | "thematicBreak" }
  | {
      type: "element";
      tag: ContainerTag;
      start?: number;
      align?: "left" | "center" | "right";
      children: DocumentationNode[];
    }
  | { type: "link"; url: string; title?: string; children: DocumentationNode[] }
  | { type: "image"; url: string; title?: string; alt: string };

type Token = ReturnType<MarkdownIt["parse"]>[number];

// Configure once; document state belongs to each parse invocation. Raw HTML is
// recognized so it can be discarded, never interpreted by React.
const options = { html: true, maxNesting: 20 };
const commonmarkTokenizer = new MarkdownIt("commonmark", options);
// CommonMark defines syntax independently of a renderer's URL policy. The
// conformance profile recognizes every destination; the UI still validates it.
commonmarkTokenizer.validateLink = () => true;
const tokenizer = new MarkdownIt("commonmark", options)
  .enable(["table", "strikethrough"])
  .use(definitionLists)
  .use(footnotes)
  .disable("footnote_inline")
  .use(mystBlocks)
  .use(mystMath);

export type DocumentationProfile = "myst" | "commonmark";

// Use the documented plugin API, with no imports from markdown-it/lib.
// Remember failed delimiter searches only for the current inline state to
// avoid repeatedly scanning an unterminated role's remaining paragraph.
const failedClosers = new WeakMap<object, Map<number, number>>();
// Preserve markdown-it-docutils' legacy name alphabet and 36-character limit.
const rolePrefix = /\{([a-zA-Z_:+-]{1,36})\}(`+)/y;
tokenizer.inline.ruler.before("backticks", "myst_role", (state, silent) => {
  if (state.src.charCodeAt(state.pos) !== 123) return false;
  rolePrefix.lastIndex = state.pos;
  const match = rolePrefix.exec(state.src);
  if (!match) return false;
  const width = match[2].length;
  if ((failedClosers.get(state)?.get(width) ?? 0) > state.pos) return false;
  const start = rolePrefix.lastIndex;
  let end = start;
  while (end < state.posMax && state.src[end] !== "\n") {
    if (state.src[end] !== "`") {
      end++;
      continue;
    }
    const close = end;
    while (end < state.posMax && state.src[end] === "`") end++;
    if (end - close !== width) continue;
    if (close === start) return false;
    if (!silent) {
      const token = state.push("myst_role", "", 0);
      token.attrSet("name", match[1]);
      token.content = state.src.slice(start, close);
    }
    state.pos = end;
    return true;
  }
  let failed = failedClosers.get(state);
  if (!failed) failedClosers.set(state, (failed = new Map<number, number>()));
  failed.set(width, end);
  return false;
});

// The legacy parser displayed initial YAML front matter as a code block.
tokenizer.block.ruler.before(
  "hr",
  "front_matter",
  (state, line, end, silent) => {
    if (line !== 0 || state.bMarks[line] !== 0 || state.tShift[line] !== 0)
      return false;
    const first = state.src.slice(state.bMarks[line], state.eMarks[line]);
    const opening = /^(-{3,})[ \t]*$/.exec(first);
    if (!opening) return false;
    for (let next = line + 1; next < end; next++) {
      const closing = state.src.slice(state.bMarks[next], state.eMarks[next]);
      const close = /^(-{3,}|\.\.\.)[ \t]*$/.exec(closing);
      if (!close || (close[1] !== "..." && close[1].length < opening[1].length))
        continue;
      if (!silent) {
        const token = state.push("code_block", "code", 0);
        token.info = "yaml";
        token.content = state.src.slice(
          state.bMarks[line + 1],
          state.bMarks[next],
        );
      }
      state.line = next + 1;
      return true;
    }
    return false;
  },
);

const containerTags: Readonly<Record<string, ContainerTag>> = {
  paragraph_open: "p",
  blockquote_open: "blockquote",
  bullet_list_open: "ul",
  ordered_list_open: "ol",
  list_item_open: "li",
  em_open: "em",
  strong_open: "strong",
  s_open: "s",
  table_open: "table",
  thead_open: "thead",
  tbody_open: "tbody",
  tr_open: "tr",
  th_open: "th",
  td_open: "td",
  dl_open: "dl",
  dt_open: "dt",
  dd_open: "dd",
};

export function tokenizeDocumentation(
  source: string,
  profile: DocumentationProfile = "myst",
): Token[] {
  return (profile === "myst" ? tokenizer : commonmarkTokenizer).parse(
    source,
    {},
  );
}

function imageText(tokens: readonly Token[]): string {
  return tokens
    .map((token) => {
      switch (token.type) {
        case "text":
        case "text_special":
        case "code_inline":
        case "myst_role":
          return token.content;
        case "softbreak":
        case "hardbreak":
          return "\n";
        case "image":
          return imageText(token.children ?? []);
        default:
          return "";
      }
    })
    .join("");
}

// One pass into the small set of nodes the app renders. A stack handles nested
// blocks without recursive slicing, HTML round trips, or general AST transforms.
export function documentationTree(
  tokens: readonly Token[],
  profile: DocumentationProfile = "myst",
  depth = 0,
): DocumentationNode[] {
  const root: DocumentationNode[] = [];
  const stack = [root];
  for (const token of tokens) {
    const children = stack[stack.length - 1];
    // CommonMark tight-list paragraphs are hidden by the tokenizer. Neither
    // opening nor closing token contributes a wrapper or alters our stack.
    if (token.hidden) continue;
    if (token.nesting === -1) {
      if (stack.length > 1) stack.pop();
      continue;
    }
    let node: DocumentationNode | undefined;
    const tag =
      token.type === "heading_open" && /^h[1-6]$/.test(token.tag)
        ? (token.tag as ContainerTag)
        : containerTags[token.type];
    if (tag) {
      node = { type: "element", tag, children: [] };
      const start = token.attrGet("start");
      if (tag === "ol" && start !== null) node.start = Number(start);
      const align = token.attrGet("style")?.replace("text-align:", "");
      if (
        (tag === "td" || tag === "th") &&
        (align === "left" || align === "center" || align === "right")
      )
        node.align = align;
    } else {
      switch (token.type) {
        case "inline":
          for (const child of documentationTree(
            token.children ?? [],
            profile,
            depth,
          ))
            children.push(child);
          continue;
        case "text":
          node = { type: "text", value: token.content };
          break;
        case "softbreak":
          node = { type: "text", value: "\n" };
          break;
        case "hardbreak":
          node = { type: "break" };
          break;
        case "hr":
          node = { type: "thematicBreak" };
          break;
        case "code_inline":
          node = { type: "code", value: token.content };
          break;
        case "code_block":
        case "fence": {
          const header =
            token.type === "fence" && profile === "myst"
              ? directiveHeader(token.info, token.content)
              : undefined;
          if (header) {
            node = { ...header, type: "directive" };
            const nested = [
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
              "figure",
              "list-table",
              "table",
            ];
            if (nested.includes(header.name) && !header.error) {
              if (depth >= 20) node.error = "Directive nesting limit exceeded";
              else {
                const isNote = ![
                  "admonition",
                  "figure",
                  "list-table",
                  "table",
                ].includes(header.name);
                const source =
                  isNote && header.args
                    ? `${header.args}\n${header.value}`
                    : header.value;
                node.children = documentationTree(
                  tokenizeDocumentation(source, profile),
                  profile,
                  depth + 1,
                );
              }
            }
          } else
            node = {
              type: "codeBlock",
              value: token.content.replace(/\n$/, ""),
              trailingNewline: token.content.endsWith("\n"),
              language: token.info
                ? tokenizer.utils
                    .unescapeAll(token.info)
                    .trim()
                    .split(/\s+/)[0] || undefined
                : undefined,
            };
          break;
        }
        case "html_inline":
        case "html_block":
          node = { type: "html", value: token.content };
          break;
        case "myst_comment":
          node = { type: "comment", value: token.content };
          break;
        case "myst_target":
          node = { type: "target", value: token.content };
          break;
        case "myst_block_break":
          node = { type: "blockBreak", value: token.content };
          break;
        case "checkbox":
          node = {
            type: "checkbox",
            checked: token.attrGet("checked") === "true",
          };
          break;
        case "math_inline":
        case "math_block":
          node = {
            type: "math",
            value: token.content,
            display:
              token.type === "math_block" ||
              token.attrGet("display") === "true",
            label: token.attrGet("label") ?? undefined,
          };
          break;
        case "footnote_block_open":
          node = { type: "footnotes", children: [] };
          break;
        case "footnote_open": {
          const meta = token.meta as { id: number; label: string };
          node = {
            type: "footnote",
            id: meta.id,
            label: meta.label,
            children: [],
          };
          break;
        }
        case "footnote_ref":
        case "footnote_anchor": {
          const meta = token.meta as {
            id: number;
            subId: number;
            label: string;
          };
          node = {
            type:
              token.type === "footnote_ref"
                ? "footnoteReference"
                : "footnoteBackref",
            id: meta.id,
            subId: meta.subId,
            label: meta.label,
          };
          break;
        }
        case "myst_role":
          node = {
            type: "mystRole",
            name: token.attrGet("name") ?? "",
            value: token.content,
          };
          break;
        case "link_open":
          node = {
            type: "link",
            url: token.attrGet("href") ?? "",
            title: token.attrGet("title") ?? undefined,
            children: [],
          };
          break;
        case "image":
          node = {
            type: "image",
            url: token.attrGet("src") ?? "",
            title: token.attrGet("title") ?? undefined,
            alt: imageText(token.children ?? []),
          };
          break;
        // Unrecognized plugin tokens do not expose arbitrary DOM attributes.
      }
    }
    if (node) children.push(node);
    if (token.nesting === 1)
      stack.push(node && "children" in node ? (node.children ?? []) : []);
  }
  return root;
}

export function parseDocumentation(
  source: string,
  profile: DocumentationProfile = "myst",
): DocumentationNode[] {
  return documentationTree(tokenizeDocumentation(source, profile), profile);
}

export function parseDocumentationInline(source: string): DocumentationNode[] {
  return documentationTree(tokenizer.parseInline(source, {}));
}

export function documentationURL(source: string): string | undefined {
  const url = tokenizer.normalizeLink(source);
  return tokenizer.validateLink(url) ? url : undefined;
}
