import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import ModulePage from "@/components/SPA/ModulePage";
import ProjectPage from "@/components/SPA/ProjectPage";
import SymbolPage from "@/components/SPA/SymbolPage";

interface Props {
  // Once we're comfortable getting rid of the `spa.receive()` magic, the `<Router>` node can move out into `_app.tsx`.
  // Then we won't need this DI. For now, this is an easy way to make this testable.
  router?: React.FC<{ children: React.ReactNode }>;
}

export default function SPAIndex({ router }: Props) {
  const Router = router || BrowserRouter;
  return (
    <Router>
      <Routes>
        <Route path="/:prj" element={<ProjectPage />} />
        <Route path="/:prj/:mod" element={<ModulePage />} />
        <Route path="/:prj/:mod/:sym" element={<SymbolPage />} />
      </Routes>
    </Router>
  );
}
