import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { applyAccentColorFromStorage } from "./lib/accentColor";

// Apply accent color immediately on page load, before React renders
applyAccentColorFromStorage();

createRoot(document.getElementById("root")!).render(<App />);
