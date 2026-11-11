import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // where the backend runs in development
  const api = env.VITE_API_PROXY_TARGET || "http://127.0.0.1:5000";

  return {
    plugins: [react(), tailwindcss()],
    server: {
      // The shop and the API share one address, exactly like production behind the web server.
      // This keeps the admin session cookie same-site (SameSite=Strict) and avoids CORS.
      proxy: {
        "/api": api,
        "/uploads": api,
        "/sitemap.xml": api,
        "/robots.txt": api,
      },
    },
    preview: {
      proxy: {
        "/api": api,
        "/uploads": api,
        "/sitemap.xml": api,
        "/robots.txt": api,
      },
    },
  };
});
