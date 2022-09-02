import styled from "@emotion/styled";

// Source: https://marketplace.visualstudio.com/items?itemName=SuperPaintman.monokai-extended
const Monokai = {
  Background: "#272822",
  Foreground: "#F8F8F2",
  Comment: "#75715E",
  Red: "#F92672",
  Orange: "#FD971F",
  "Light Orange": "#E69F66",
  Yellow: "#E6DB74",
  Green: "#A6E22E",
  Blue: "#66D9EF",
  Purple: "#AE81FF",
};

// https://github.com/microsoft/vscode/blob/main/extensions/theme-monokai/themes/monokai-color-theme.json

export const Keyword = styled.span`
  font-weight: bold;
  color: ${Monokai.Red};
`;

export const Fn = styled.span`
  color: ${Monokai.Green};
`;
export const Ty = Fn;

export const StringLiteral = styled.span`
  color: ${Monokai.Yellow};
`;

export const NumberLiteral = styled.span`
  color: ${Monokai.Purple};
`;

export const LibraryConstant = styled.span`
  color: ${Monokai.Blue};
`;

export const Literal = (props: { children: React.ReactNode }) => {
  const value = props.children?.toString();
  if (value?.startsWith('"') || value?.startsWith("'")) {
    return <StringLiteral>{props.children}</StringLiteral>;
  } else if (value?.match(/[0-9]/)) {
    // Super rough heuristic: if there's a digit in it, we'll assume it's a number
    return <NumberLiteral>{props.children}</NumberLiteral>;
  } else if (["True", "False", "None"].includes(value || "")) {
    return <LibraryConstant>{props.children}</LibraryConstant>;
  } else {
    return <>{props.children}</>;
  }
};
