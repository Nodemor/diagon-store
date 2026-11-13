import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // where the backend runs in development
  const api = env.VITE_API_PROXY_TARGET || "http://127.0.0.1:5000";

  // the shop's public address, for the link-preview image in index.html (deploy.sh passes SITE_URL)
  const siteUrl = (env.VITE_SITE_URL || "").trim().replace(/\/$/, "");
  const siteUrlInHtml = {
    name: "diagon-site-url",
    transformIndexHtml: (html) => html.replaceAll("__SITE_URL__", siteUrl),
  };

  return {
    plugins: [react(), tailwindcss(), siteUrlInHtml],
    server: {
      // The shop and the API share one address, exactly like production behind the web server.
      // This keeps the admin session cookie same-site (SameSite=Strict) and avoids CORS.
      proxy: {
        "/api": api,
        "/uploads": api,
        "/sitemap.xml": api,
        "/robots.txt": api,
        "/s/": api, // share links with WhatsApp / Facebook previews
      },
    },
    preview: {
      proxy: {
        "/api": api,
        "/uploads": api,
        "/sitemap.xml": api,
        "/robots.txt": api,
        "/s/": api, // share links with WhatsApp / Facebook previews
      },
    },
  };
});
