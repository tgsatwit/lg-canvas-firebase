import { Client } from "@langchain/langgraph-sdk";

export const createClient = () => {
  // Use the same URL as the current window (could be port 3000 or 3002)
  const apiUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api` 
    : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api");
  
  return new Client({
    apiUrl,
  });
};
