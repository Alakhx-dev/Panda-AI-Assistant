import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Immediate hydration to prevent flash
const savedTheme = localStorage.getItem("app-theme") || "fusion-dark";
document.documentElement.setAttribute("data-theme", savedTheme);

createRoot(document.getElementById("root")!).render(<App />);
