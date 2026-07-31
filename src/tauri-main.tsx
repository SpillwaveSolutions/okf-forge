/**
 * Client-only entry for the Tauri desktop shell.
 * Web/Vercel continues to use TanStack Start (src/routes).
 */
import { createRoot } from "react-dom/client";
import { AppShell } from "@/components/okf/AppShell";
import "./styles.css";

const el = document.getElementById("root");
if (!el) throw new Error("Missing #root");

createRoot(el).render(<AppShell />);
