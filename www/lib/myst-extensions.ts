import type MarkdownIt from "markdown-it";

type BlockRule = Parameters<MarkdownIt["block"]["ruler"]["before"]>[2];
type BlockState = Parameters<BlockRule>[0];
const interrupts = {
  alt: ["paragraph", "reference", "blockquote", "list", "footnote_def"],
};
const lineText = (state: BlockState, line: number) =>
  state.src.slice(state.bMarks[line] + state.tShift[line], state.eMarks[line]);
const isCode = (state: BlockState, line: number) =>
  state.sCount[line] - state.blkIndent >= 4;

// MyST's colon_fence mode uses the same indentation/closing rules as ordinary
// fences. Rules use markdown-it's public plugin state, never private imports.
export function mystBlocks(md: MarkdownIt): void {
  md.block.ruler.before(
    "fence",
    "colon_fence",
    (state, start, end, silent) => {
      if (isCode(state, start)) return false;
      const match = /^(:{3,})(.*)$/.exec(lineText(state, start));
      if (!match) return false;
      if (silent) return true;
      let next = start + 1;
      let closed = false;
      for (; next < end; next++) {
        if (!state.isEmpty(next) && state.sCount[next] < state.blkIndent) break;
        if (isCode(state, next)) continue;
        const close = /^(:{3,})[ \t]*$/.exec(lineText(state, next));
        if (close && close[1].length >= match[1].length) {
          closed = true;
          break;
        }
      }
      const token = state.push("fence", "code", 0);
      token.info = match[2];
      token.markup = match[1];
      token.content = state.getLines(
        start + 1,
        next,
        state.sCount[start],
        true,
      );
      state.line = next + (closed ? 1 : 0);
      token.map = [start, state.line];
      return true;
    },
    interrupts,
  );

  md.block.ruler.before(
    "blockquote",
    "myst_comment",
    (state, start, end, silent) => {
      if (isCode(state, start) || !lineText(state, start).startsWith("%"))
        return false;
      if (silent) return true;
      let next = start;
      const lines = [];
      while (
        next < end &&
        !isCode(state, next) &&
        lineText(state, next).startsWith("%")
      ) {
        lines.push(lineText(state, next).slice(1).trimEnd());
        next++;
      }
      state.push("myst_comment", "", 0).content = lines.join("\n").trim();
      state.line = next;
      return true;
    },
    interrupts,
  );

  md.block.ruler.before(
    "hr",
    "myst_target",
    (state, start, _end, silent) => {
      if (isCode(state, start)) return false;
      const match = /^\(([^()\r\n]+)\)=[ \t]*$/.exec(lineText(state, start));
      if (!match) return false;
      if (silent) return true;
      state.push("myst_target", "", 0).content = match[1];
      state.line = start + 1;
      return true;
    },
    interrupts,
  );

  md.block.ruler.before(
    "hr",
    "myst_block_break",
    (state, start, _end, silent) => {
      if (isCode(state, start)) return false;
      const match = /^(?:\+[ \t]*){3,}(.*)$/.exec(lineText(state, start));
      if (!match) return false;
      if (silent) return true;
      state.push("myst_block_break", "", 0).content = match[1].trim();
      state.line = start + 1;
      return true;
    },
    interrupts,
  );

  md.core.ruler.after("inline", "task_list", (state) => {
    for (let index = 2; index < state.tokens.length; index++) {
      const token = state.tokens[index];
      if (
        token.type !== "inline" ||
        state.tokens[index - 1].type !== "paragraph_open" ||
        state.tokens[index - 2].type !== "list_item_open"
      )
        continue;
      const first = token.children?.[0];
      if (!first || first.type !== "text") continue;
      const match = /^\[([ xX])\](?=\s)/.exec(first.content);
      if (!match) continue;
      first.content = first.content.slice(3);
      const checkbox = new state.Token("checkbox", "input", 0);
      checkbox.attrSet("checked", match[1] === " " ? "false" : "true");
      token.children?.unshift(checkbox);
    }
  });
}

function escaped(source: string, position: number): boolean {
  let count = 0;
  while (position > 0 && source[--position] === "\\") count++;
  return count % 2 === 1;
}

// Match legacy's enabled dollarmath defaults: spaces/digits/labels and double
// inline dollars are allowed. The modes are explicit in compatibility.md.
export function mystMath(md: MarkdownIt): void {
  const failed = new WeakMap<object, Set<number>>();
  md.inline.ruler.before("escape", "math_inline", (state, silent) => {
    if (state.src[state.pos] !== "$" || escaped(state.src, state.pos))
      return false;
    const width = state.src[state.pos + 1] === "$" ? 2 : 1;
    if (failed.get(state)?.has(width)) return false;
    const start = state.pos + width;
    let end = start;
    while ((end = state.src.indexOf("$", end)) !== -1 && end < state.posMax) {
      if (
        escaped(state.src, end) ||
        (width === 2 && state.src[end + 1] !== "$")
      ) {
        end++;
        continue;
      }
      if (end === start) return false;
      if (!silent) {
        const token = state.push("math_inline", "math", 0);
        token.content = state.src.slice(start, end);
        token.attrSet("display", String(width === 2));
      }
      state.pos = end + width;
      return true;
    }
    let widths = failed.get(state);
    if (!widths) failed.set(state, (widths = new Set<number>()));
    widths.add(width);
    return false;
  });

  md.block.ruler.before("fence", "math_block", (state, start, end, silent) => {
    if (isCode(state, start) || !lineText(state, start).startsWith("$$"))
      return false;
    const lines: string[] = [];
    for (let next = start; next < end; next++) {
      if (
        next > start &&
        !state.isEmpty(next) &&
        state.sCount[next] < state.blkIndent
      )
        break;
      const line =
        next === start
          ? lineText(state, next).slice(2)
          : state.getLines(next, next + 1, state.blkIndent, false);
      const close = /\$\$(?:[ \t]*\(([^)$\r\n]+)\))?[ \t]*$/.exec(line);
      if (close) {
        if (silent) return true;
        lines.push(line.slice(0, close.index));
        const token = state.push("math_block", "math", 0);
        token.content = lines.join("\n").trim();
        if (close[1]) token.attrSet("label", close[1].replace(/\s+/g, "-"));
        state.line = next + 1;
        return true;
      }
      lines.push(line);
    }
    return false;
  });

  const environments =
    "equation|multline|gather|align|alignat|flalign|matrix|pmatrix|bmatrix|Bmatrix|vmatrix|Vmatrix|eqnarray";
  const open = new RegExp(`^\\\\begin\\{(${environments})(\\*?)\\}`);
  md.block.ruler.before(
    "blockquote",
    "amsmath",
    (state, start, end, silent) => {
      if (isCode(state, start)) return false;
      const match = open.exec(lineText(state, start));
      if (!match) return false;
      const closing = `\\end{${match[1]}${match[2]}}`;
      for (let next = start; next < end; next++) {
        if (
          next > start &&
          !state.isEmpty(next) &&
          state.sCount[next] < state.blkIndent
        )
          break;
        if (!lineText(state, next).trimEnd().endsWith(closing)) continue;
        if (silent) return true;
        state.push("math_block", "math", 0).content = state.getLines(
          start,
          next + 1,
          state.blkIndent,
          false,
        );
        state.line = next + 1;
        return true;
      }
      return false;
    },
    interrupts,
  );
}
