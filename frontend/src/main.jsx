import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig } from "motion/react";
// fonts served by the shop itself (no extra connections to Google on first load)
import "@fontsource-variable/figtree/wght.css";
import "@fontsource-variable/figtree/wght-italic.css";
import "@fontsource/im-fell-english/latin-400.css";
import "@fontsource/im-fell-english/latin-400-italic.css";
import "./index.css";
import { reloadForNewVersion } from "./lib/lazyPage";
import App from "./App.jsx";
import { SettingsProvider } from "./context/SettingsContext";
import { CartProvider } from "./context/CartContext";
import { SmoothScroll } from "./components/motion/SmoothScroll";

// a page file from before the latest update couldn't be preloaded: load the new version
window.addEventListener("vite:preloadError", (event) => {
  if (reloadForNewVersion()) event.preventDefault();
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* reducedMotion="user": Motion animations respect the OS "reduce motion" setting */}
    <MotionConfig reducedMotion="user">
      <SettingsProvider>
        <CartProvider>
          <SmoothScroll>
            <App />
          </SmoothScroll>
        </CartProvider>
      </SettingsProvider>
    </MotionConfig>
  </StrictMode>,
);
