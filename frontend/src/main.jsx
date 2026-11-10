import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig } from "motion/react";
import "./index.css";
import App from "./App.jsx";
import { SettingsProvider } from "./context/SettingsContext";
import { CartProvider } from "./context/CartContext";
import { SmoothScroll } from "./components/motion/SmoothScroll";

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
