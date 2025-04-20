import { NextRequest, NextResponse } from "next/server";
import { Client } from "@langchain/langgraph-sdk";
import { LANGGRAPH_API_URL } from "@/constants";
import { verifyUserAuthenticated } from "@/lib/firebase/verify_user_server";
import { createScopedLogger } from "@/utils/logger";

const logger = createScopedLogger("api/store/get");

export async function POST(req: NextRequest) {
  try {
    const decodedToken = await verifyUserAuthenticated();
    if (!decodedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } catch (e) {
    logger.error("Failed to fetch user", { error: String(e) });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let namespace, key;
  
  // Safely parse JSON with validation
  try {
    // Check if request body is empty
    const text = await req.text();
    if (!text || text.trim() === '') {
      logger.error("Empty request body");
      return NextResponse.json({ error: "Request body is empty" }, { status: 400 });
    }
    
    // Try to parse JSON
    const data = JSON.parse(text);
    
    // Validate required fields
    namespace = data.namespace;
    key = data.key;
    
    if (!namespace || !key) {
      logger.error("Missing required fields", { namespace, key });
      return NextResponse.json({ 
        error: "Both 'namespace' and 'key' are required" 
      }, { status: 400 });
    }
  } catch (e) {
    logger.error("Failed to parse request JSON", { error: String(e) });
    return NextResponse.json({ 
      error: "Invalid JSON in request body" 
    }, { status: 400 });
  }

  const lgClient = new Client({
    apiKey: process.env.LANGCHAIN_API_KEY,
    apiUrl: LANGGRAPH_API_URL,
  });

  try {
    const item = await lgClient.store.getItem(namespace, key);

    return NextResponse.json({ item }, { status: 200 });
  } catch (error) {
    logger.error("Failed to get item from store", { 
      namespace, 
      key, 
      error: String(error) 
    });
    
    return NextResponse.json({ 
      error: "Failed to retrieve item from store",
      success: false
    }, { status: 500 });
  }
}
