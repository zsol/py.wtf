import React from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { ThemeProvider } from "styled-components";

import ModulePage from "@/components/SPA/ModulePage";
import ProjectPage from "@/components/SPA/ProjectPage";
import SymbolPage from "@/components/SPA/SymbolPage";
import { darkTheme } from "@/components/core/theme/theme";

import * as spa from "@/lib/spa";

export default function SPAIndex() {
  spa.receive();
  return (
    <ThemeProvider theme={darkTheme}>
      <Router>
        <Routes>
          <Route path="/:prj" element={<ProjectPage />} />
          <Route path="/:prj/:mod" element={<ModulePage />} />
          <Route path="/:prj/:mod/:sym" element={<SymbolPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
