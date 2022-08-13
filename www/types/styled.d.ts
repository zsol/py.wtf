import { WuiTheme } from "@welcome-ui/core";
import "@xstyled/styled-components";
import "styled-components";

interface AppTheme extends WuiTheme {
  // customize your theme
}

declare module "@xstyled/styled-components" {
  export interface Theme extends AppTheme {}
}

declare module "styled-components" {
  export interface DefaultTheme extends AppTheme {}
}
