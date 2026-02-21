import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";
import App from "./App.tsx";
import Home from "./pages/Home.tsx";
import Agents from "./pages/Agents.tsx";
import Settings from "./pages/Settings.tsx";
import Skills from "./pages/Skills.tsx";
import OverlayRoot from "./overlay/OverlayRoot.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/overlay" element={<OverlayRoot />} />
          <Route path="/" element={<App />}>
            <Route index element={<Home />} />
            <Route path="c/:conversationId" element={<Home />} />
            <Route path="agents" element={<Agents />} />
            <Route path="settings" element={<Settings />} />
            <Route path="skills" element={<Skills />} />
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  </StrictMode>
);
