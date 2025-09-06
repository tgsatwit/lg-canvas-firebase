import { NextRequest, NextResponse } from "next/server";
import { chatDb } from "@/lib/firebase/config";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { adminAuth } from "@/lib/firebase/admin";

interface RecurringTask {
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
  recurringPattern: "daily" | "weekly" | "monthly";
  lastGenerated?: string;
  nextDueDate?: string;
  subTasks: SubTask[];
}

interface TaskTag {
  id: string;
  name: string;
  color: string;
}

interface SubTask {
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

function calculateNextDueDate(pattern: "daily" | "weekly" | "monthly", fromDate?: Date): Date {
  const baseDate = fromDate || new Date();
  const nextDate = new Date(baseDate);
  
  switch (pattern) {
    case "daily":
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case "weekly":
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case "monthly":
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
  }
  
  // Set time to beginning of day
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

// POST /api/tasks/recurring - Generate recurring tasks
export async function POST(request: NextRequest) {
  try {
    const decodedToken = await verifyAuth(request);
    
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    
    // Fetch all recurring task templates
    const tasksRef = collection(chatDb, "tasks");
    const recurringQuery = query(
      tasksRef,
      where("isRecurring", "==", true)
    );
    
    const snapshot = await getDocs(recurringQuery);
    const generatedTasks: any[] = [];
    
    for (const taskDoc of snapshot.docs) {
      const task = taskDoc.data() as RecurringTask;
      
      // Check if task needs to be generated
      const lastGenerated = task.lastGenerated ? new Date(task.lastGenerated) : null;
      const nextDueDate = task.nextDueDate ? new Date(task.nextDueDate) : todayStart;
      
      // Only generate if we haven't generated today or if it's past the next due date
      if (!lastGenerated || lastGenerated < todayStart || now >= nextDueDate) {
        // Calculate the next due date based on pattern
        const newDueDate = calculateNextDueDate(task.recurringPattern, nextDueDate);
        
        // Create a new task instance
        const newTask = {
          title: task.title,
          description: task.description,
          status: "todo" as const,
          priority: task.priority,
          dueDate: newDueDate.toISOString(),
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          tags: task.tags,
          assignedTo: task.assignedTo,
          createdBy: task.createdBy,
          isRecurring: false, // The instance is not recurring
          parentRecurringTaskId: taskDoc.id,
          subTasks: task.subTasks.map(st => ({ ...st, completed: false })),
        };
        
        // Add the new task instance
        const newTaskRef = await addDoc(collection(chatDb, "tasks"), newTask);
        generatedTasks.push({ id: newTaskRef.id, ...newTask });
        
        // Update the recurring template with last generated time and next due date
        await updateDoc(doc(chatDb, "tasks", taskDoc.id), {
          lastGenerated: now.toISOString(),
          nextDueDate: newDueDate.toISOString(),
          updatedAt: now.toISOString(),
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      generated: generatedTasks.length,
      tasks: generatedTasks,
    });
  } catch (error) {
    console.error("Error generating recurring tasks:", error);
    return NextResponse.json(
      { error: "Failed to generate recurring tasks" },
      { status: 500 }
    );
  }
}

// GET /api/tasks/recurring - Get all recurring task templates
export async function GET(request: NextRequest) {
  try {
    const decodedToken = await verifyAuth(request);
    const userId = decodedToken.uid;
    
    const tasksRef = collection(chatDb, "tasks");
    const recurringQuery = query(
      tasksRef,
      where("isRecurring", "==", true),
      where("createdBy", "==", userId)
    );
    
    const snapshot = await getDocs(recurringQuery);
    const recurringTasks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json(recurringTasks);
  } catch (error) {
    console.error("Error fetching recurring tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch recurring tasks" },
      { status: 500 }
    );
  }
}