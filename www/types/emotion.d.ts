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
    };
  }
}
