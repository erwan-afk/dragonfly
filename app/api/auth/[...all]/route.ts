import { auth } from "@/utils/auth/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Force dynamic rendering - don't try to statically generate this route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Wrapper avec gestion d'erreur et logs
const createHandler = () => {
  try {
    const authHandler = toNextJsHandler(auth);

    const wrapHandler = (originalHandler: (request: Request) => Promise<Response>) => {
      return async (request: Request) => {
        try {
          const response = await originalHandler(request);
          return response;
        } catch (error) {
          console.error('Better Auth error:', error);
          return new Response(
            JSON.stringify({ 
              error: "Authentication request failed",
              details: error instanceof Error ? error.message : "Unknown error"
            }),
            { 
              status: 500,
              headers: { "Content-Type": "application/json" }
            }
          );
        }
      };
    };
    
    return {
      GET: wrapHandler(authHandler.GET),
      POST: wrapHandler(authHandler.POST)
    };
  } catch (error) {
    console.error("❌ Error creating Better Auth handler:", error);
    // Fallback handler
    const fallbackHandler = async (request: Request) => {
      const url = new URL(request.url);
      console.error(`❌ Fallback handler for ${request.method} ${url.pathname}`);
      return new Response(
        JSON.stringify({ error: "Authentication service temporarily unavailable" }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    };
    
    return {
      GET: fallbackHandler,
      POST: fallbackHandler
    };
  }
};

const handler = createHandler();

export const GET = handler.GET;
export const POST = handler.POST;
