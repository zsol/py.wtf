import "styled-components";

declare module "styled-components" {
  export interface DefaultTheme {
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
