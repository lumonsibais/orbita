import "@/shared/ui/global.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@/app/App";
import { AppProviders } from "@/app/AppProviders";

const root = document.getElementById("root");
if (!root) {
  throw new Error("No se encontró el elemento #root en index.html");
}

createRoot(root).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
);
