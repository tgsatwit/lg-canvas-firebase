import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminFirestore } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in-progress" | "review" | "done";
  priority: "low" | "medium" | "high";
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  tags: TaskTag[];
  assignedTo?: string;
  createdBy: string;
  isRecurring: boolean;
  recurringPattern?: "daily" | "weekly" | "monthly";
  subTasks: SubTask[];
}

export interface TaskTag {
  id: string;
  name: string;
  color: string;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
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

// GET /api/tasks - Get all tasks for current user
export async function GET(request: NextRequest) {
  try {
    const decodedToken = await verifyAuth(request);
    const userId = decodedToken.uid;
    
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter"); // "owned", "assigned", or "all"
    
    const firestore = adminFirestore();
    if (!firestore) {
      throw new Error("Firestore not initialized");
    }
    const tasksRef = firestore.collection("tasks");
    let query;
    
    if (filter === "owned") {
      query = tasksRef
        .where("createdBy", "==", userId)
        .orderBy("createdAt", "desc");
    } else if (filter === "assigned") {
      query = tasksRef
        .where("assignedTo", "==", userId)
        .orderBy("createdAt", "desc");
    } else {
      // Get all tasks (for collaborative environment)
      // Since this is an internal tool, all authenticated users can see all tasks
      query = tasksRef.orderBy("createdAt", "desc");
    }
    
    const snapshot = await query.get();
    const tasks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const decodedToken = await verifyAuth(request);
    const userId = decodedToken.uid;
    
    const taskData = await request.json();
    
    const firestore = adminFirestore();
    if (!firestore) {
      throw new Error("Firestore not initialized");
    }
    const newTask = {
      ...taskData,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const docRef = await firestore.collection("tasks").add(newTask);
    
    return NextResponse.json({
      id: docRef.id,
      ...newTask,
    });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}

// PUT /api/tasks - Update a task
export async function PUT(request: NextRequest) {
  try {
    const decodedToken = await verifyAuth(request);
    const userId = decodedToken.uid;
    
    const { id, ...updates } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }
    
    const firestore = adminFirestore();
    if (!firestore) {
      throw new Error("Firestore not initialized");
    }
    const taskRef = firestore.collection("tasks").doc(id);
    const taskDoc = await taskRef.get();
    
    if (!taskDoc.exists) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }
    
    const taskData = taskDoc.data();
    
    // Check if user has permission to update this task
    if (taskData?.createdBy !== userId && taskData?.assignedTo !== userId) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }
    
    await taskRef.update({
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    
    return NextResponse.json({
      id,
      ...taskData,
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks - Delete a task
export async function DELETE(request: NextRequest) {
  try {
    const decodedToken = await verifyAuth(request);
    const userId = decodedToken.uid;
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }
    
    const firestore = adminFirestore();
    if (!firestore) {
      throw new Error("Firestore not initialized");
    }
    const taskRef = firestore.collection("tasks").doc(id);
    const taskDoc = await taskRef.get();
    
    if (!taskDoc.exists) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }
    
    const taskData = taskDoc.data();
    
    // Only creator can delete task
    if (taskData?.createdBy !== userId) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }
    
    await taskRef.delete();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}