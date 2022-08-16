import { BrowserRouter, Route, Routes } from "react-router-dom";

import ModulePage from "@/components/SPA/ModulePage";
import ProjectPage from "@/components/SPA/ProjectPage";
import SymbolPage from "@/components/SPA/SymbolPage";

export const SPARoutes = (
  <Routes>
    <Route path="/:prj" element={<ProjectPage />} />
    <Route path="/:prj/:mod" element={<ModulePage />} />
    <Route path="/:prj/:mod/:sym" element={<SymbolPage />} />
  </Routes>
);

export default function SPAIndex() {
  return <BrowserRouter>{SPARoutes}</BrowserRouter>;
}
