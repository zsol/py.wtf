import MarkdownIt from "markdown-it";

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
  | "s";

export type DocumentationNode =
  | MySTRole
  | { type: "text" | "code" | "codeBlock"; value: string }
  | { type: "break" | "thematicBreak" }
  | {
      type: "element";
      tag: ContainerTag;
      start?: number;
      children: DocumentationNode[];
    }
  | { type: "link"; url: string; title?: string; children: DocumentationNode[] }
  | { type: "image"; url: string; title?: string; alt: string };

type Token = ReturnType<MarkdownIt["parse"]>[number];

// Configure once; document state belongs to each parse invocation. Raw HTML is
// recognized so it can be discarded, never interpreted by React.
const options = { html: true, maxNesting: 20 };
const tokenizer = new MarkdownIt("commonmark", options);
tokenizer.enable("strikethrough");

// Use the documented plugin API, with no imports from markdown-it/lib.
// Remember failed delimiter searches only for the current inline state to
// avoid repeatedly scanning an unterminated role's remaining paragraph.
const failedClosers = new WeakMap<object, Map<number, number>>();
const rolePrefix = /\{([a-zA-Z_][a-zA-Z0-9_:+-]{0,63})\}(`+)/y;
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
    if (line !== 0 || state.tShift[line] !== 0) return false;
    const first = state.src.slice(state.bMarks[line], state.eMarks[line]);
    if (!/^---[ \t]*$/.test(first)) return false;
    for (let next = line + 1; next < end; next++) {
      const closing = state.src.slice(state.bMarks[next], state.eMarks[next]);
      if (!/^(?:---|\.\.\.)[ \t]*$/.test(closing)) continue;
      if (!silent) {
        const token = state.push("code_block", "code", 0);
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

// Footnotes have no UI here. Keep definitions readable and prevent CommonMark
// from turning [^note] into a spurious ordinary URL reference.
tokenizer.block.ruler.before(
  "reference",
  "literal_footnote",
  (state, line, _end, silent) => {
    if (state.sCount[line] - state.blkIndent >= 4) return false;
    const content = state.src.slice(
      state.bMarks[line] + state.tShift[line],
      state.eMarks[line],
    );
    if (!/^\[\^[^\]\n]+\]:/.test(content)) return false;
    if (!silent) {
      state.push("paragraph_open", "p", 1);
      const token = state.push("inline", "", 0);
      token.content = content;
      token.children = [];
      state.push("paragraph_close", "p", -1);
    }
    state.line = line + 1;
    return true;
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
};

export function tokenizeDocumentation(source: string): Token[] {
  return tokenizer.parse(source, {});
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
): DocumentationNode[] {
  const root: DocumentationNode[] = [];
  const stack = [root];
  for (const token of tokens) {
    const children = stack[stack.length - 1];
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
    } else {
      switch (token.type) {
        case "inline":
          for (const child of documentationTree(token.children ?? []))
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
        case "fence":
          node = { type: "codeBlock", value: token.content.replace(/\n$/, "") };
          break;
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
        // html_inline/html_block and future unsupported tokens are omitted.
      }
    }
    if (node) children.push(node);
    if (token.nesting === 1)
      stack.push(node && "children" in node ? node.children : []);
  }
  return root;
}

export function parseDocumentation(source: string): DocumentationNode[] {
  return documentationTree(tokenizeDocumentation(source));
}
