// The published @types package selects the incompatible CommonJS MarkdownIt
// declaration. This plugin uses the same public ESM API as our application.
declare module "markdown-it-footnote" {
  import type MarkdownIt from "markdown-it" with {
    "resolution-mode": "import",
  };
  const footnotes: (parser: MarkdownIt) => void;
  export default footnotes;
}
