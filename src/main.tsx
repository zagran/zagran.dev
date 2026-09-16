import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { PRERENDER_ID } from "./lib/article-markup";
import "./index.css";

// Article pages ship a static copy of the post for crawlers that never run this
// bundle (see the prerender plugin in vite.config.ts). Drop it before mounting
// so the page isn't rendered twice.
document.getElementById(PRERENDER_ID)?.remove();

createRoot(document.getElementById("root")!).render(<App />);
