const colors = {
  slate: {
    light: "#65686b",
    mid: "#292c33",
    dark: "#191c20",
  },
  white: "#ffffff",
  grey: {
    light: "#dedede",
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
    codeBackground: colors.slate.dark,
    mainText: colors.grey.light,
    link: {
      default: colors.cornflower.mid,
      hover: colors.cornflower.light,
      visited: colors.cornflower.mid,
    },
    sidebar: {
      highlight: colors.grey.light,
    },
  },
  spacing: spacing,
};
