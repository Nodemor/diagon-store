import { useEffect } from "react";
import { useSettings } from "../context/SettingsContext";

/** Sets document.title: "<title> — Diagon Store", or the store's SEO title for the home page (null). */
export function usePageTitle(title) {
  const { storeName, metaTitle } = useSettings();
  useEffect(() => {
    document.title = title ? `${title} — ${storeName}` : metaTitle || storeName;
  }, [title, storeName, metaTitle]);
}
