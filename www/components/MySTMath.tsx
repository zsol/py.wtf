import { renderToString } from "katex";

export default function MySTMath({
  value,
  display,
}: {
  value: string;
  display: boolean;
}) {
  let mathml: string | undefined;
  try {
    // Only KaTeX-generated MathML enters this sink. Raw document HTML is never
    // passed here; trust=false blocks URL/HTML commands and macros are local.
    mathml = renderToString(value, {
      output: "mathml",
      displayMode: display,
      trust: false,
      strict: "error",
      throwOnError: true,
      maxExpand: 1000,
      maxSize: 20,
      macros: {},
    });
  } catch {
    // Invalid/unsupported TeX remains visible; no unescaped error enters HTML.
  }
  if (mathml !== undefined)
    return (
      <span
        className="myst-math"
        dangerouslySetInnerHTML={{ __html: mathml }}
      />
    );
  return (
    <span className="math unhandled">
      <span>Unsupported or invalid math: </span>
      <code>{value}</code>
    </span>
  );
}
