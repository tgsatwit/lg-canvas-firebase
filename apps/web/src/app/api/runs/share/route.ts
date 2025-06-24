import { NextRequest, NextResponse } from "next/server";
import { Client } from "langsmith";
import { createScopedLogger } from "@/utils/logger";

const logger = createScopedLogger("api/runs/share");
const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds
const REQUEST_TIMEOUT = 10000; // 10 seconds

async function shareRunWithRetry(
  lsClient: Client,
  runId: string
): Promise<string> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout")), REQUEST_TIMEOUT);
      });
      
      const sharePromise = lsClient.shareRun(runId);
      return await Promise.race([sharePromise, timeoutPromise]) as string;
    } catch (error) {
      logger.error(`Share run attempt ${attempt} failed for runId ${runId}`, { error: String(error) });
      
      if (attempt === MAX_RETRIES) {
        throw error;
      }
      
      console.warn(
        `Attempt ${attempt} failed. Retrying in ${RETRY_DELAY / 1000} seconds...`
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    }
  }
  throw new Error("Max retries reached"); // This line should never be reached due to the throw in the loop
}

export async function POST(req: NextRequest) {
  let runId: string;
  
  try {
    const body = await req.json();
    runId = body.runId;
    
    if (!runId) {
      logger.warn("Missing runId in request");
      return new NextResponse(
        JSON.stringify({
          error: "`runId` is required to share run.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    logger.error("Failed to parse request JSON", { error: String(error) });
    return new NextResponse(
      JSON.stringify({ error: "Invalid request format" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const lsClient = new Client({
    apiKey: process.env.LANGCHAIN_API_KEY,
  });

  try {
    const sharedRunURL = await shareRunWithRetry(lsClient, runId);

    return new NextResponse(JSON.stringify({ sharedRunURL }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error(
      `Failed to share run with id ${runId} after ${MAX_RETRIES} attempts`,
      { error: String(error) }
    );
    
    // Return a more graceful response that treats this as non-critical
    return new NextResponse(
      JSON.stringify({ 
        error: "Failed to share run after multiple attempts.",
        success: false,
        sharedRunURL: null 
      }),
      {
        status: 200, // Changed from 500 to 200 to not block client operation
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
