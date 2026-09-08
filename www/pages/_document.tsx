import { Head, Html, Main, NextScript } from "next/document";

import { restoreSPARouteScript } from "@/lib/spaFallback";

export default function Document() {
  return (
    <Html>
      <Head>
        <script dangerouslySetInnerHTML={{ __html: restoreSPARouteScript }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
