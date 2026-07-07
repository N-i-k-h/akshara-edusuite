import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Block mouse wheel scroll from modifying focused number input values
document.addEventListener("wheel", (event) => {
  if (
    document.activeElement &&
    document.activeElement.tagName === "INPUT" &&
    (document.activeElement as HTMLInputElement).type === "number"
  ) {
    event.preventDefault();
  }
}, { passive: false });

createRoot(document.getElementById("root")!).render(<App />);
