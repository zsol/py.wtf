const colors = {
  slate: {
    light: "#65686b",
    mid: "#292c33",
    dark: "#191c20",
  },
  white: "#ffffff",
  black: "#000000",
  grey: {
    lightest: "#e9e9e9",
    light: "#d4d4d4",
    mid: "#9a9a9a",
    dark: "#707070",
    darkest: "#454545",
  },
  cornflower: {
    light: "#9ebcf0",
    mid: "#6495ED",
    dark: "#1563ed",
  },
};

const spacing = {
  xxs: "0.25em",
  xs: "0.5em",
  s: "0.75em",
  m: "1em",
  l: "1.5em",
  xl: "2em",
};

export const darkTheme = {
  colors: {
    pageBackground: {
      light: colors.slate.light,
      mid: colors.slate.mid,
      dark: colors.slate.dark,
    },
    code: {
      background: colors.slate.dark,
      backgroundHighlighted: "#1b180e", // dark ... yellow ... ish, I guess?
      anchor: colors.slate.light,
    },
    mainText: colors.grey.light,
    link: {
      default: colors.cornflower.mid,
      hover: colors.cornflower.light,
      visited: colors.cornflower.mid,
    },
    sidebar: {
      highlight: colors.grey.light,
    },
    footer: {
      text: colors.grey.dark,
      separator: colors.grey.darkest,
    },
    input: {
      background: colors.white,
      border: colors.grey.lightest,
      text: colors.black,
      hover: colors.grey.lightest,
    },
  },
  spacing: spacing,
};
