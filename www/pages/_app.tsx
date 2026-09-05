import { AppProps } from "next/app";
import { useSyncExternalStore } from "react";

import "../styles/global.css";

const subscribe = () => () => {};

function App({ Component, pageProps }: AppProps) {
  // Keep browser-only routes out of server rendering and initial hydration.
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  if (!isClient) {
    return null;
  }

  return <Component {...pageProps} />;
}

export default App;
