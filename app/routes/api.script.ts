import type { LoaderFunctionArgs } from "@remix-run/node";
import { readFileSync } from "fs";
import { join } from "path";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Serve the FFM tracker script
  const scriptPath = join(process.cwd(), "public", "ffm-tracker.js");
  
  try {
    const script = readFileSync(scriptPath, "utf-8");
    
    return new Response(script, {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Failed to load FFM tracker script:", error);
    return new Response("// Script not found", {
      status: 404,
      headers: { "Content-Type": "application/javascript" },
    });
  }
};

