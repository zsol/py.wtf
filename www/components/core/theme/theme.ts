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
  s: "0.75em",
  m: "1em",
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
