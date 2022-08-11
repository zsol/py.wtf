import { createTheme } from "@welcome-ui/core";

const colors = {
  primary: {
    500: "#FF0000",
  },
  secondary: {
    500: "#00FF00",
  },
  slate: {
    200: "#65686b",
    500: "#292c33",
    700: "#191c20",
  },
  grey: {
    100: "#ffffff",
    300: "#dedede",
  },
};

export const theme = createTheme({
  colors: colors,
  // spacing: {
  //   "3xl": 50,
  //   "4xl": 70,
  // },
  // example if you need to remove border radius
  // radii: {
  //   sm: 0,
  //   md: 0,
  //   lg: 0,
  // },
  // space: {
  //   lg: 24,
  // },
  // breakpoints: {
  //   xl: 1024,
  // },
  links: {
    default: {
      color: "cornflowerblue",
    },
    sidebarLink: {
      color: colors.grey[300],
    },
  },
});
