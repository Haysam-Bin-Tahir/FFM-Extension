import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { PrismaClient } from "@prisma/client";
import { restResources } from "@shopify/shopify-api/rest/admin/2024-10";

const prisma = new PrismaClient();

// In development, SHOPIFY_APP_URL is set by Shopify CLI
// Fall back to HOST or VITE_SHOPIFY_APP_URL if needed
const appUrl = process.env.SHOPIFY_APP_URL || process.env.HOST || "";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.October24,
  scopes: process.env.SCOPES?.split(","),
  appUrl,
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  restResources,
  webhooks: {
    ORDERS_CREATE: {
      deliveryMethod: "http",
      callbackUrl: "/webhooks",
    },
  },
  hooks: {
    afterAuth: async ({ session, admin }) => {
      // Register webhooks after authentication
      await shopify.registerWebhooks({ session });

      // Register the FFM tracking script tag
      const appUrl = process.env.SHOPIFY_APP_URL || "";
      const scriptSrc = `${appUrl}/api/script`;

      try {
        // Check if script tag already exists
        const existingScripts = await admin.rest.resources.ScriptTag.all({
          session,
        });

        const scriptExists = existingScripts.data.some(
          (script) => script.src === scriptSrc
        );

        if (!scriptExists) {
          const scriptTag = new admin.rest.resources.ScriptTag({ session });
          scriptTag.event = "onload";
          scriptTag.src = scriptSrc;
          scriptTag.display_scope = "all";
          await scriptTag.save({ update: true });
          console.log("[FFM] Script tag registered successfully");
        } else {
          console.log("[FFM] Script tag already exists");
        }
      } catch (error) {
        console.error("[FFM] Failed to register script tag:", error);
      }
    },
  },
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    wrapWithHostHeader: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.October24;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
export { prisma };

