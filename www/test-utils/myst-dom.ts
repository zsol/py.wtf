interface DOMFact {
  tag: string;
  attributes: [string, string][];
  children: (string | DOMFact)[];
}
export function semanticDOM(source: string): (string | DOMFact)[] {
  const template = document.createElement("template");
  template.innerHTML = source;
  const blockLayout = /^(?:|UL|OL|LI|BLOCKQUOTE|DIV|SECTION|ASIDE)$/;
  const block = /^(?:P|UL|OL|LI|BLOCKQUOTE|PRE|HR|DIV|SECTION|H[1-6])$/;
  function children(
    parent: ParentNode,
    verbatim = false,
  ): (string | DOMFact)[] {
    const result: (string | DOMFact)[] = [];
    for (const child of Array.from(parent.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        let text = child.textContent ?? "";
        if (!verbatim) {
          // Ignore HTML serialization indentation between blocks, but retain
          // paragraph/code content, including significant boundary spaces.
          if (
            !text.trim() &&
            blockLayout.test(
              parent.nodeName === "#document-fragment" ? "" : parent.nodeName,
            )
          )
            continue;
          if (child.nextSibling && block.test(child.nextSibling.nodeName))
            text = text.replace(/\n$/, "");
          if (
            child.previousSibling &&
            block.test(child.previousSibling.nodeName)
          )
            text = text.replace(/^\n/, "");
          if (child.previousSibling?.nodeName === "BR")
            text = text.replace(/^\n/, "");
        }
        if (text) result.push(text);
      } else if (child instanceof HTMLElement) {
        if (child.tagName === "STYLE") continue; // Emotion-generated CSS
        if (child.tagName === "PICTURE") {
          result.push(...children(child, verbatim));
          continue;
        }
        result.push({
          tag: child.tagName.toLowerCase(),
          attributes: Array.from(child.attributes)
            .filter((a) => !(a.name === "class" && a.value.startsWith("css-")))
            .map((a) => [a.name, a.value] as [string, string])
            .sort(([a], [b]) => a.localeCompare(b)),
          children: children(child, verbatim || child.tagName === "PRE"),
        });
      }
    }
    return result;
  }
  return children(template.content);
}
