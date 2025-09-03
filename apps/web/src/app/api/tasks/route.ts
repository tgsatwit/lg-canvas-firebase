import { NextRequest, NextResponse } from "next/server";
import { chatDb } from "@/lib/firebase/config";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  getDoc,
} from "firebase/firestore";
import { adminAuth } from "@/lib/firebase/admin";

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
    
    const tasksRef = collection(chatDb, "tasks");
    let q;
    
    if (filter === "owned") {
      q = query(
        tasksRef,
        where("createdBy", "==", userId),
        orderBy("createdAt", "desc")
      );
    } else if (filter === "assigned") {
      q = query(
        tasksRef,
        where("assignedTo", "==", userId),
        orderBy("createdAt", "desc")
      );
    } else {
      // Get all tasks where user is either creator or assignee
      const ownedQuery = query(
        tasksRef,
        where("createdBy", "==", userId),
        orderBy("createdAt", "desc")
      );
      const assignedQuery = query(
        tasksRef,
        where("assignedTo", "==", userId),
        orderBy("createdAt", "desc")
      );
      
      const [ownedSnapshot, assignedSnapshot] = await Promise.all([
        getDocs(ownedQuery),
        getDocs(assignedQuery),
      ]);
      
      const ownedTasks = ownedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const assignedTasks = assignedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Combine and deduplicate
      const allTasks = [...ownedTasks, ...assignedTasks];
      const uniqueTasks = allTasks.filter((task, index, self) =>
        index === self.findIndex(t => t.id === task.id)
      );
      
      return NextResponse.json(uniqueTasks);
    }
    
    const snapshot = await getDocs(q);
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
    
    const newTask = {
      ...taskData,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const docRef = await addDoc(collection(chatDb, "tasks"), newTask);
    
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
    
    const taskRef = doc(chatDb, "tasks", id);
    const taskDoc = await getDoc(taskRef);
    
    if (!taskDoc.exists()) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }
    
    const taskData = taskDoc.data();
    
    // Check if user has permission to update this task
    if (taskData.createdBy !== userId && taskData.assignedTo !== userId) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }
    
    await updateDoc(taskRef, {
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
    
    const taskRef = doc(chatDb, "tasks", id);
    const taskDoc = await getDoc(taskRef);
    
    if (!taskDoc.exists()) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }
    
    const taskData = taskDoc.data();
    
    // Only creator can delete task
    if (taskData.createdBy !== userId) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }
    
    await deleteDoc(taskRef);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}