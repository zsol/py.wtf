import "@emotion/react";

declare module "@emotion/react" {
  export interface Theme {
    colors: {
      pageBackground: {
        light: string;
        mid: string;
        dark: string;
      };
      codeBackground: string;
      mainText: string;
      link: {
        default: string;
        hover: string;
        visited: string;
      };
      sidebar: {
        highlight: string;
      };
    };
    spacing: {
      xxs: string;
      xs: string;
      s: string;
      m: string;
      l: string;
      xl: string;
    };
  }
}
