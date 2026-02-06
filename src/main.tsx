import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Bump this string to verify which frontend build is live.
// (Custom domains can occasionally serve cached bundles.)
const BLOXCITY_BUILD = "2026-02-06.02";

// Visible in browser devtools
console.log(`[BLOX City] build=${BLOXCITY_BUILD}`);
// Also accessible from the console: window.__BLOXCITY_BUILD
// @ts-expect-error - debug global
window.__BLOXCITY_BUILD = BLOXCITY_BUILD;

createRoot(document.getElementById("root")!).render(<App />);
