import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const normalizeOrigin = (value?: string) => {
  const trimmed = value?.trim();
  if (!trimmed) {
    return "";
  }

  return trimmed.replace(/\/+$/, "");
};

const normalizeAbsoluteUrl = (value?: string) => {
  const normalized = normalizeOrigin(value);
  if (!normalized) {
    return "";
  }

  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  return `https://${normalized}`;
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const publicAppUrl =
    normalizeAbsoluteUrl(env.VITE_PUBLIC_APP_URL) ||
    normalizeAbsoluteUrl(env.VERCEL_PROJECT_PRODUCTION_URL) ||
    normalizeAbsoluteUrl(env.VERCEL_URL);
  const ogUrl = publicAppUrl || "/";
  const ogImageUrl = publicAppUrl
    ? `${publicAppUrl}/og-image.jpg`
    : "/og-image.jpg";

  return {
    plugins: [
      react(),
      {
        name: "simmer-html-meta-fallbacks",
        transformIndexHtml(html) {
          return html
            .replaceAll("__SIMMER_OG_URL__", ogUrl)
            .replaceAll("__SIMMER_OG_IMAGE_URL__", ogImageUrl);
        },
      },
    ],
    build: {
      outDir: "dist",
      sourcemap: true,
    },
  };
});
