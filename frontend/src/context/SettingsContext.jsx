import { createContext, useContext, useEffect, useState } from "react";
import { getSettings } from "../services/store";

// Store details edited in Admin → Settings (name, WhatsApp, email, social links, hours...)
const FALLBACK = {
  storeName: "Diagon Store",
  tagline: "Every shop in one alley.",
  currency: "LKR",
  announcement: "",
  whatsappNumber: "",
};

const SettingsContext = createContext(FALLBACK);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(FALLBACK);

  useEffect(() => {
    const controller = new AbortController();
    getSettings({ signal: controller.signal })
      .then((data) => setSettings({ ...FALLBACK, ...data }))
      .catch(() => {}); // fallback values keep the site usable if the API is down
    return () => controller.abort();
  }, []);

  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSettings = () => useContext(SettingsContext);
