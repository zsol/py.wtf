import React from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";

import ModulePage from "@/components/SPA/ModulePage";
import PackagePage from "@/components/SPA/PackagePage";
import SymbolPage from "@/components/SPA/SymbolPage";

export default function SPA() {
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
