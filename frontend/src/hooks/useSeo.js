import { useEffect } from "react";
import { useSettings } from "../context/SettingsContext";
import { isAdminPathname } from "../lib/adminPath";

// Per-page SEO (proposal §23): <title>, meta description, canonical link,
// Open Graph / Twitter tags for link previews (WhatsApp, Facebook) and optional JSON-LD.

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!content) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setJsonLd(data) {
  const id = "page-jsonld";
  document.getElementById(id)?.remove();
  if (!data) return;
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.id = id;
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

const clip = (text, max = 160) => {
  const plain = String(text || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return plain.length > max ? `${plain.slice(0, max - 1).trimEnd()}…` : plain;
};

/**
 * useSeo({ title, description, image, type, jsonLd, noindex })
 * title: null = the store's home page title from Admin → Settings.
 */
export function useSeo({ title, description, image, type = "website", jsonLd, noindex = false } = {}) {
  const { storeName, metaTitle, metaDescription } = useSettings();
  const jsonKey = jsonLd ? JSON.stringify(jsonLd) : "";

  useEffect(() => {
    const fullTitle = title ? `${title} — ${storeName}` : metaTitle || storeName;
    const desc = clip(description || metaDescription);
    const url = window.location.origin + window.location.pathname + (window.location.pathname === "/shop" ? window.location.search : "");
    const img = image ? new URL(image, window.location.origin).toString() : null;

    document.title = fullTitle;
    setMeta("name", "description", desc);
    // the back office is never indexed
    setMeta("name", "robots", noindex || isAdminPathname(window.location.pathname) ? "noindex, nofollow" : null);
    setLink("canonical", url);
    setMeta("property", "og:site_name", storeName);
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:type", type);
    setMeta("property", "og:url", url);
    setMeta("property", "og:image", img);
    setMeta("name", "twitter:card", img ? "summary_large_image" : "summary");
    setJsonLd(jsonKey ? JSON.parse(jsonKey) : null);
  }, [title, description, image, type, jsonKey, noindex, storeName, metaTitle, metaDescription]);
}
