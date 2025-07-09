import { auth } from "@/utils/auth/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Wrapper avec gestion d'erreur et logs
const createHandler = () => {
  try {
    console.log("🔍 Creating Better Auth handler...");
    const authHandler = toNextJsHandler(auth);
    console.log("✅ Better Auth handler created successfully");
    
    // Wrapper pour ajouter des logs
    const wrapHandler = (originalHandler: (request: Request) => Promise<Response>) => {
      return async (request: Request) => {
        const url = new URL(request.url);
        const method = request.method;
        const pathname = url.pathname;
        
        console.log(`🚀 Better Auth API called: ${method} ${pathname}`);
        
        try {
          const response = await originalHandler(request);
          console.log(`✅ Better Auth response: ${response.status} for ${method} ${pathname}`);
          return response;
        } catch (error) {
          console.error(`❌ Better Auth error for ${method} ${pathname}:`, error);
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
