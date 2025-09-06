import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminFirestore } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

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

// POST /api/tasks/bulk - Bulk operations on tasks
export async function POST(request: NextRequest) {
  try {
    const decodedToken = await verifyAuth(request);
    const userId = decodedToken.uid;
    
    const { action, taskIds, updates } = await request.json();
    
    if (!action || !taskIds || !Array.isArray(taskIds)) {
      return NextResponse.json(
        { error: "Action and taskIds array are required" },
        { status: 400 }
      );
    }
    
    const firestore = adminFirestore();
    if (!firestore) {
      throw new Error("Firestore not initialized");
    }
    const batch = firestore.batch();
    
    // Get all tasks first to verify permissions
    const taskPromises = taskIds.map(taskId => 
      firestore.collection("tasks").doc(taskId).get()
    );
    
    const taskDocs = await Promise.all(taskPromises);
    const validTasks = [];
    
    for (const [index, taskDoc] of taskDocs.entries()) {
      if (!taskDoc.exists) {
        console.warn(`Task ${taskIds[index]} not found`);
        continue;
      }
      
      const taskData = taskDoc.data();
      const taskId = taskIds[index];
      
      // Check permissions based on action
      if (action === "delete") {
        // Only creator can delete
        if (taskData?.createdBy !== userId) {
          console.warn(`User ${userId} cannot delete task ${taskId} - not creator`);
          continue;
        }
      } else {
        // For other operations, creator or assignee can modify
        if (taskData?.createdBy !== userId && taskData?.assignedTo !== userId) {
          console.warn(`User ${userId} cannot modify task ${taskId} - no permission`);
          continue;
        }
      }
      
      validTasks.push({ id: taskId, doc: taskDoc, data: taskData });
    }
    
    if (validTasks.length === 0) {
      return NextResponse.json(
        { error: "No valid tasks found for bulk operation" },
        { status: 400 }
      );
    }
    
    // Perform bulk operation
    switch (action) {
      case "complete":
        for (const task of validTasks) {
          batch.update(firestore.collection("tasks").doc(task.id), {
            status: "done",
            updatedAt: new Date().toISOString(),
          });
        }
        break;
        
      case "assign":
        const { assignToUserId } = updates || {};
        if (!assignToUserId) {
          return NextResponse.json(
            { error: "assignToUserId is required for assign action" },
            { status: 400 }
          );
        }
        
        for (const task of validTasks) {
          batch.update(firestore.collection("tasks").doc(task.id), {
            assignedTo: assignToUserId,
            updatedAt: new Date().toISOString(),
          });
        }
        break;
        
      case "unassign":
        for (const task of validTasks) {
          batch.update(firestore.collection("tasks").doc(task.id), {
            assignedTo: FieldValue.delete(),
            updatedAt: new Date().toISOString(),
          });
        }
        break;
        
      case "update_status":
        const { status } = updates || {};
        if (!status || !["todo", "in-progress", "review", "done"].includes(status)) {
          return NextResponse.json(
            { error: "Valid status is required for update_status action" },
            { status: 400 }
          );
        }
        
        for (const task of validTasks) {
          batch.update(firestore.collection("tasks").doc(task.id), {
            status,
            updatedAt: new Date().toISOString(),
          });
        }
        break;
        
      case "delete":
        for (const task of validTasks) {
          batch.delete(firestore.collection("tasks").doc(task.id));
        }
        break;
        
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
    
    await batch.commit();
    
    return NextResponse.json({
      success: true,
      processed: validTasks.length,
      total: taskIds.length,
      action,
    });
    
  } catch (error) {
    console.error("Error performing bulk operation:", error);
    return NextResponse.json(
      { error: "Failed to perform bulk operation" },
      { status: 500 }
    );
  }
}