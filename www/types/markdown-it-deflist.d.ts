declare module "markdown-it-deflist" {
  import type MarkdownIt from "markdown-it" with {
    "resolution-mode": "import",
  };
  const definitionLists: (parser: MarkdownIt) => void;
  export default definitionLists;
}
