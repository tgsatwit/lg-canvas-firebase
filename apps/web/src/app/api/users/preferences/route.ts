import { NextRequest, NextResponse } from "next/server";
import { chatDb } from "@/lib/firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { adminAuth } from "@/lib/firebase/admin";

interface UserPreferences {
  theme: "light" | "dark" | "system";
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    taskUpdates: boolean;
    taskAssignments: boolean;
    projectUpdates: boolean;
  };
  taskViewPreference: "board" | "list";
  defaultTaskPriority: "low" | "medium" | "high";
  updatedAt: string;
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

// GET /api/users/preferences - Get user preferences
export async function GET(request: NextRequest) {
  try {
    const decodedToken = await verifyAuth(request);
    const userId = decodedToken.uid;
    
    const preferencesRef = doc(chatDb, "userPreferences", userId);
    const preferencesDoc = await getDoc(preferencesRef);
    
    if (preferencesDoc.exists()) {
      const data = preferencesDoc.data();
      return NextResponse.json(data);
    } else {
      // Return default preferences if none exist
      const defaultPreferences: Partial<UserPreferences> = {
        theme: "system",
        language: "en-US",
        timezone: "America/New_York",
        notifications: {
          email: true,
          push: true,
          taskUpdates: true,
          taskAssignments: true,
          projectUpdates: true,
        },
        taskViewPreference: "board",
        defaultTaskPriority: "medium",
      };
      
      return NextResponse.json(defaultPreferences);
    }
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch user preferences" },
      { status: 500 }
    );
  }
}

// POST /api/users/preferences - Update user preferences
export async function POST(request: NextRequest) {
  try {
    const decodedToken = await verifyAuth(request);
    const userId = decodedToken.uid;
    
    const preferences = await request.json();
    
    const preferencesData: UserPreferences = {
      ...preferences,
      updatedAt: new Date().toISOString(),
    };
    
    const preferencesRef = doc(chatDb, "userPreferences", userId);
    await setDoc(preferencesRef, preferencesData, { merge: true });
    
    return NextResponse.json({
      success: true,
      preferences: preferencesData,
    });
  } catch (error) {
    console.error("Error updating user preferences:", error);
    return NextResponse.json(
      { error: "Failed to update user preferences" },
      { status: 500 }
    );
  }
}