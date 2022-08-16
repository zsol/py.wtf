import "@emotion/react";

declare module "@emotion/react" {
  export interface Theme {
    colors: {
      pageBackground: {
        light: string;
        mid: string;
        dark: string;
      };
      code: {
        background: string;
        backgroundHighlighted: string;
        anchor: string;
      };
      mainText: string;
      link: {
        default: string;
        hover: string;
        visited: string;
      };
      sidebar: {
        highlight: string;
      };
      footer: {
        separator: string;
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
