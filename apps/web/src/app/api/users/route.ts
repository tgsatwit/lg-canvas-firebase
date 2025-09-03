import { NextRequest, NextResponse } from "next/server";
import { chatDb } from "@/lib/firebase/config";
import { collection, query, limit, getDocs, where } from "firebase/firestore";
import { adminAuth } from "@/lib/firebase/admin";

export interface User {
  id: string;
  name?: string;
  email?: string;
  image?: string;
}

async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("No valid auth token provided");
  }
  
  const token = authHeader.split("Bearer ")[1];
  const auth = adminAuth();
  if (!auth) {
    throw new Error("Admin auth not initialized");
  }
  const decodedToken = await auth.verifyIdToken(token);
  return decodedToken;
}

// GET /api/users - Get users for task assignment
export async function GET(request: NextRequest) {
  try {
    await verifyAuth(request);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    
    const usersRef = collection(chatDb, "users");
    let q;
    
    if (search) {
      // Search by name or email
      q = query(
        usersRef,
        where("name", ">=", search),
        where("name", "<=", search + "\uf8ff"),
        limit(20)
      );
    } else {
      // Get all users (limited to 50)
      q = query(usersRef, limit(50));
    }
    
    const snapshot = await getDocs(q);
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}