export function redirect() {
  if (typeof window === "undefined") {
    return;
  }
  // Single Page Apps for GitHub Pages
  // MIT License
  // https://github.com/rafgraph/spa-github-pages
  // This script takes the current url and converts the path and query
  // string into just a query string, and then redirects the browser
  // to the new url with only a query string and hash fragment,
  // e.g. https://www.foo.tld/one/two?a=b&c=d#qwe, becomes
  // https://www.foo.tld/?/one/two&a=b~and~c=d#qwe
  // Note: this 404.html file must be at least 512 bytes for it to work
  // with Internet Explorer (it is currently > 512 bytes)

  // If you're creating a Project Pages site and NOT using a custom domain,
  // then set pathSegmentsToKeep to 1 (enterprise users may need to set it to > 1).
  // This way the code will only replace the route part of the path, and not
  // the real directory in which the app resides, for example:
  // https://username.github.io/repo-name/one/two?a=b&c=d#qwe becomes
  // https://username.github.io/repo-name/?/one/two&a=b~and~c=d#qwe
  // Otherwise, leave pathSegmentsToKeep as 0.
  const pathSegmentsToKeep = 0;

  const l = window.location;
  l.replace(
    l.protocol +
      "//" +
      l.hostname +
      (l.port ? ":" + l.port : "") +
      l.pathname
        .split("/")
        .slice(0, 1 + pathSegmentsToKeep)
        .join("/") +
      "/_spa?/" +
      l.pathname
        .slice(1)
        .split("/")
        .slice(pathSegmentsToKeep)
        .join("/")
        .replace(/&/g, "~and~") +
      (l.search ? "&" + l.search.slice(1).replace(/&/g, "~and~") : "") +
      l.hash
  );
}

export function receive() {
  if (typeof window === "undefined") {
    return;
  }
  // Single Page Apps for GitHub Pages
  // MIT License
  // https://github.com/rafgraph/spa-github-pages
  // This script checks to see if a redirect is present in the query string,
  // converts it back into the correct url and adds it to the
  // browser's history using window.history.replaceState(...),
  // which won't cause the browser to attempt to load the new url.
  // When the single page app is loaded further down in this file,
  // the correct url will be waiting in the browser's history for
  // the single page app to route accordingly.
  const l = window.location;
  if (l.search[1] === "/") {
    const decoded = l.search
      .slice(1)
      .split("&")
      .map(function (s) {
        return s.replace(/~and~/g, "&");
      })
      .join("?");
    window.history.replaceState(null, "", decoded + l.hash);
  }
}
