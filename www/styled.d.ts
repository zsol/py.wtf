import "styled-components";
import "@xstyled/styled-components";
import { WuiTheme } from "@welcome-ui/core";

interface AppTheme extends WuiTheme {
  // customize your theme
}

declare module "@xstyled/styled-components" {
  export interface Theme extends AppTheme {}
}

declare module "styled-components" {
  export interface DefaultTheme extends AppTheme {}
}
