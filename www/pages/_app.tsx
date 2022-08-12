import { AppProps } from "next/app";
import React, { useEffect, useState } from "react";

function App({ Component, pageProps }: AppProps) {
  const [secondPass, setSecondPass] = useState(false);

  useEffect(() => {
    setSecondPass(true);
  }, [secondPass]);

  if (!secondPass) {
    return null;
  }

  return <Component {...pageProps} />;
}

export default App;
