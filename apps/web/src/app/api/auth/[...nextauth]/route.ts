import NextAuth from "next-auth";
import { authOptions } from "@/auth";

// For NextAuth v4, we directly export the handler functions
// rather than using the handlers property
export const GET = NextAuth(authOptions);
export const POST = NextAuth(authOptions); 