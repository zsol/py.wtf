import React from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";

import ModulePage from "@/components/SPA/ModulePage";
import PackagePage from "@/components/SPA/PackagePage";
import SymbolPage from "@/components/SPA/SymbolPage";

export default function SPAIndex() {
  /// Start Single Page Apps for GitHub Pages
  const l = window.location;
  const s = decodeURIComponent(l.search);
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
  if (s[1] === "/") {
    const decoded: string = s
      .slice(1)
      .split("&")
      .map(function (s) {
        return s.replace(/~and~/g, "&");
      })
      .join("?")
      .replace(/=$/g, "");
    window.history.replaceState(null, "", decoded + l.hash);
  }
  //// End Single Page Apps for GitHub Pages

  return (
    <Router>
      <Routes>
        <Route path="/:pkg" element={<PackagePage />} />
        <Route path="/:pkg/:mod" element={<ModulePage />} />
        <Route path="/:pkg/:mod/:sym" element={<SymbolPage />} />
      </Routes>
    </Router>
  );
}
