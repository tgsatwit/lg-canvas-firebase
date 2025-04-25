import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { auth as firebaseAuth } from "@/lib/firebase/client";
import { signInWithEmailAndPassword } from "firebase/auth";

// Extend next-auth types to include user ID
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}

export const authOptions: NextAuthOptions = {
  // Configure JWT for session management
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/signout",
    error: "/auth/login", // Error code passed in query string as ?error=
  },
  
  // Auth secret should be set in environment variables
  // You can generate a secret with: `openssl rand -base64 32`
  secret: process.env.AUTH_SECRET || "tUXL/gKjz3Q67p4YA8kjlhsDUeXeYSrAcYLTbDUsEpo=",
  
  providers: [
    CredentialsProvider({
      id: "email-login",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          // Authenticate with Firebase
          const userCredential = await signInWithEmailAndPassword(
            firebaseAuth,
            credentials.email,
            credentials.password
          );
          
          // Get the Firebase user
          const firebaseUser = userCredential.user;
          
          if (!firebaseUser || !firebaseUser.email) {
            return null;
          }

          // Return a simplified user object
          return {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
            image: firebaseUser.photoURL,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      }
    })
  ],
  
  callbacks: {
    async jwt({ token, user }) {
      // Add user ID to the JWT when authenticating
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    
    async session({ session, token }) {
      // Add user ID to the session
      if (session.user) {
        session.user.id = token.id;
      }
      return session;
    }
  }
};

export default NextAuth(authOptions); 