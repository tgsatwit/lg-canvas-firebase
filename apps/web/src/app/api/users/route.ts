import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminFirestore } from "@/lib/firebase/admin";

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
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

// GET /api/users - Get all users for task assignment
export async function GET(request: NextRequest) {
  try {
    const decodedToken = await verifyAuth(request);
    
    // First, ensure the current user exists in the users collection
    const firestore = adminFirestore();
    if (!firestore) {
      throw new Error("Firestore not initialized");
    }
    
    const currentUserId = decodedToken.uid;
    const currentUserRef = firestore.collection("users").doc(currentUserId);
    const currentUserDoc = await currentUserRef.get();
    
    if (!currentUserDoc.exists) {
      // Create user profile if it doesn't exist
      const userProfile: UserProfile = {
        id: currentUserId,
        email: decodedToken.email || "",
        displayName: decodedToken.name || decodedToken.email?.split("@")[0] || "User",
        photoURL: decodedToken.picture || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Filter out any undefined values to avoid Firestore errors
      const cleanedProfile = Object.fromEntries(
        Object.entries(userProfile).filter(([_, value]) => value !== undefined)
      ) as UserProfile;
      
      await currentUserRef.set(cleanedProfile);
    }
    
    // Fetch all users from Firestore
    const usersRef = firestore.collection("users");
    const snapshot = await usersRef.get();
    
    const users: UserProfile[] = [];
    
    // Get users from Firestore
    snapshot.docs.forEach(doc => {
      const userData = doc.data() as UserProfile;
      users.push({
        ...userData,
        id: doc.id, // Override with the document ID
      });
    });
    
    // Also fetch users from Firebase Auth to ensure we have all users
    const auth = adminAuth();
    if (auth) {
      try {
        const listUsersResult = await auth.listUsers(1000);
        
        for (const userRecord of listUsersResult.users) {
          // Check if user already exists in our array
          const existingUser = users.find(u => u.id === userRecord.uid);
          
          if (!existingUser) {
            // Add user from Auth if not in Firestore
            const userProfile: UserProfile = {
              id: userRecord.uid,
              email: userRecord.email || "",
              displayName: userRecord.displayName || userRecord.email?.split("@")[0] || "User",
              photoURL: userRecord.photoURL || "",
              createdAt: userRecord.metadata.creationTime || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            
            // Filter out any undefined values to avoid Firestore errors
            const cleanedProfile = Object.fromEntries(
              Object.entries(userProfile).filter(([_, value]) => value !== undefined)
            ) as UserProfile;
            
            // Save to Firestore for future use
            await firestore.collection("users").doc(userRecord.uid).set(cleanedProfile);
            users.push(userProfile);
          }
        }
      } catch (authError) {
        console.error("Error fetching users from Auth:", authError);
        // Continue with users from Firestore only
      }
    }
    
    // Sort users by display name
    users.sort((a, b) => a.displayName.localeCompare(b.displayName));
    
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST /api/users - Create or update user profile
export async function POST(request: NextRequest) {
  try {
    const decodedToken = await verifyAuth(request);
    const userId = decodedToken.uid;
    
    const firestore = adminFirestore();
    if (!firestore) {
      throw new Error("Firestore not initialized");
    }
    
    const userData = await request.json();
    
    const userProfile: UserProfile = {
      id: userId,
      email: userData.email || decodedToken.email || "",
      displayName: userData.displayName || decodedToken.name || decodedToken.email?.split("@")[0] || "User",
      photoURL: userData.photoURL || decodedToken.picture || "",
      createdAt: userData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Filter out any undefined values to avoid Firestore errors
    const cleanedProfile = Object.fromEntries(
      Object.entries(userProfile).filter(([_, value]) => value !== undefined)
    ) as UserProfile;
    
    const userRef = firestore.collection("users").doc(userId);
    await userRef.set(cleanedProfile, { merge: true });
    
    return NextResponse.json(userProfile);
  } catch (error) {
    console.error("Error creating/updating user profile:", error);
    return NextResponse.json(
      { error: "Failed to create/update user profile" },
      { status: 500 }
    );
  }
}