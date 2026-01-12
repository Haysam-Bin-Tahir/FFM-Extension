import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

declare module "@remix-run/node" {
  interface Future {
    v3_singleFetch: true;
  }
}

// Must be hosted on HTTPS for Shopify embedded apps
const host = process.env.SHOPIFY_APP_URL 
  ? new URL(process.env.SHOPIFY_APP_URL).host 
  : undefined;

export default defineConfig({
  server: {
    port: Number(process.env.PORT) || 3000,
    host: "localhost",
    allowedHosts: [".trycloudflare.com", host].filter(Boolean) as string[],
    hmr: {
      protocol: "ws",
      host: "localhost",
    },
  },
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  plugins: [
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true,
        v3_lazyRouteDiscovery: true,
      },
    }),
    tsconfigPaths(),
  ],
});

