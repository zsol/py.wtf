// Runs before hydration so BrowserRouter sees the original static-host URL.
export const restoreSPARouteScript = String.raw`
(function () {
  var l = window.location;
  if (l.pathname !== "/_spa.html" || l.hash) {
    return;
  }
  var envelope = l.search.match(/^\?__py_wtf_spa=([^&]*)$/);
  if (!envelope) {
    return;
  }
  try {
    var route = decodeURIComponent(envelope[1]);
    if (
      route.charAt(0) !== "/" || route.charAt(1) === "/" ||
      /[\\\u0000-\u0020]/.test(route) ||
      new URL(route, l.origin).origin !== l.origin
    ) {
      return;
    }
    window.history.replaceState(null, "", route);
  } catch (_) {
    // Ignore malformed envelopes and leave ordinary routing intact.
  }
})();
`;
