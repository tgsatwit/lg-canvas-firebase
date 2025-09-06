"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserContext } from "@/contexts/UserContext";

// Generate UUID using crypto API
function uuidv4(): string {
  if (typeof window !== 'undefined' && window.crypto) {
    return (window.crypto as any).randomUUID();
  }
  
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, 
        v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export type TaskTag = {
  id: string;
  name: string;
  color: string;
};

export type SubTask = {
  id: string;
  title: string;
  completed: boolean;
};

export type Task = {
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
  assignedToUser?: UserInfo; // Populated user info
  createdBy: string;
  createdByUser?: UserInfo; // Populated user info
  isRecurring: boolean;
  recurringPattern?: "daily" | "weekly" | "monthly";
  subTasks: SubTask[];
};

export type UserInfo = {
  id: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
};

export type Column = {
  id: string;
  title: string;
  taskIds: string[];
};

export type Board = {
  tasks: Record<string, Task>;
  columns: Record<string, Column>;
  columnOrder: string[];
};

const initialBoard: Board = {
  tasks: {},
  columns: {
    "column-1": {
      id: "column-1",
      title: "To Do",
      taskIds: [],
    },
    "column-2": {
      id: "column-2",
      title: "In Progress",
      taskIds: [],
    },
    "column-3": {
      id: "column-3",
      title: "Review",
      taskIds: [],
    },
    "column-4": {
      id: "column-4",
      title: "Done",
      taskIds: [],
    },
  },
  columnOrder: ["column-1", "column-2", "column-3", "column-4"],
};

interface TaskContextType {
  board: Board;
  tags: TaskTag[];
  users: UserInfo[];
  loading: boolean;
  filter: "all" | "owned" | "assigned";
  setFilter: (filter: "all" | "owned" | "assigned") => void;
  createTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt" | "createdBy">) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  createSubTask: (taskId: string, title: string) => void;
  updateSubTask: (taskId: string, subTaskId: string, updates: Partial<SubTask>) => void;
  deleteSubTask: (taskId: string, subTaskId: string) => void;
  createTag: (name: string, color: string) => TaskTag;
  deleteTag: (tagId: string) => void;
  moveTask: (taskId: string, sourceColumn: string, destinationColumn: string, newIndex: number) => Promise<void>;
  refreshTasks: () => Promise<void>;
  bulkUpdateTasks: (taskIds: string[], action: string, updates?: any) => Promise<void>;
  assignTasksToSelf: (taskIds: string[]) => Promise<void>;
  completeAllTasks: (taskIds: string[]) => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

// Define type-safe status-to-column and column-to-status mappings
type StatusToColumnMap = {
  [key in Task["status"]]: string;
};

type ColumnToStatusMap = {
  [key: string]: Task["status"];
};

const statusToColumnMap: StatusToColumnMap = {
  "todo": "column-1",
  "in-progress": "column-2",
  "review": "column-3",
  "done": "column-4",
};

const columnToStatusMap: ColumnToStatusMap = {
  "column-1": "todo",
  "column-2": "in-progress",
  "column-3": "review",
  "column-4": "done",
};

export function TaskProvider({ children }: { children: ReactNode }) {
  const [board, setBoard] = useState<Board>(initialBoard);
  const [tags, setTags] = useState<TaskTag[]>([
    { id: "tag-1", name: "Urgent", color: "bg-red-500" },
    { id: "tag-2", name: "Feature", color: "bg-blue-500" },
    { id: "tag-3", name: "Enhancement", color: "bg-yellow-500" },
    { id: "tag-4", name: "Bug", color: "bg-green-500" },
  ]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "owned" | "assigned">("all");
  const { user } = useAuth();

  // Helper function to get auth token
  const getAuthToken = useCallback(async () => {
    if (!user) throw new Error("User not authenticated");
    return await user.getIdToken();
  }, [user]);

  // Function to fetch tasks from API
  const fetchTasks = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const token = await getAuthToken();
      const url = new URL("/api/tasks", window.location.origin);
      url.searchParams.set("filter", filter);
      
      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const tasks = await response.json();
        organizeTasksIntoBoard(tasks);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  }, [user, filter, getAuthToken]);

  // Function to fetch users
  const fetchUsers = useCallback(async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch("/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const fetchedUsers = await response.json();
        setUsers(fetchedUsers);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, [getAuthToken]);

  // Function to populate user information in tasks
  const populateUserInfo = useCallback((tasks: Task[], users: UserInfo[]): Task[] => {
    return tasks.map(task => ({
      ...task,
      assignedToUser: task.assignedTo ? users.find(u => u.id === task.assignedTo) : undefined,
      createdByUser: users.find(u => u.id === task.createdBy),
    }));
  }, []);

  // Function to organize tasks into board structure
  const organizeTasksIntoBoard = useCallback((tasks: Task[]) => {
    const tasksWithUserInfo = populateUserInfo(tasks, users);
    
    const newBoard: Board = {
      tasks: {},
      columns: {
        "column-1": { id: "column-1", title: "To Do", taskIds: [] },
        "column-2": { id: "column-2", title: "In Progress", taskIds: [] },
        "column-3": { id: "column-3", title: "Review", taskIds: [] },
        "column-4": { id: "column-4", title: "Done", taskIds: [] },
      },
      columnOrder: ["column-1", "column-2", "column-3", "column-4"],
    };

    tasksWithUserInfo.forEach((task) => {
      newBoard.tasks[task.id] = task;
      const columnId = statusToColumnMap[task.status];
      newBoard.columns[columnId].taskIds.push(task.id);
    });

    setBoard(newBoard);
  }, [users, populateUserInfo]);

  // Fetch users on mount
  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user, fetchUsers]);

  // Use API-based fetching instead of real-time listener for better consistency
  useEffect(() => {
    if (user && users.length > 0) {
      fetchTasks();
    }
  }, [user, filter, users, fetchTasks]);

  // Load tags from localStorage (keeping this local for now)
  useEffect(() => {
    try {
      const storedTags = localStorage.getItem("taskTags");
      if (storedTags) {
        setTags(JSON.parse(storedTags));
      }
    } catch (error) {
      console.error("Error loading tags from localStorage:", error);
    }
  }, []);

  // Save tags to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("taskTags", JSON.stringify(tags));
    } catch (error) {
      console.error("Error saving tags to localStorage:", error);
    }
  }, [tags]);

  const createTask = async (taskData: Omit<Task, "id" | "createdAt" | "updatedAt" | "createdBy">) => {
    try {
      const token = await getAuthToken();
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(taskData),
      });
      
      if (response.ok) {
        // Refresh tasks to get the updated list
        await fetchTasks();
      } else {
        throw new Error("Failed to create task");
      }
    } catch (error) {
      console.error("Error creating task:", error);
      throw error;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const token = await getAuthToken();
      const response = await fetch("/api/tasks", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: taskId, ...updates }),
      });
      
      if (response.ok) {
        // Refresh tasks to get the updated list
        await fetchTasks();
      } else {
        throw new Error("Failed to update task");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      throw error;
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`/api/tasks?id=${taskId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        // Refresh tasks to get the updated list
        await fetchTasks();
      } else {
        throw new Error("Failed to delete task");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      throw error;
    }
  };

  const createSubTask = (taskId: string, title: string) => {
    const newSubTaskId = uuidv4();
    
    setBoard((prev) => {
      const task = prev.tasks[taskId];
      
      if (!task) return prev;
      
      const newSubTask: SubTask = {
        id: newSubTaskId,
        title,
        completed: false,
      };
      
      const updatedTask = {
        ...task,
        subTasks: [...task.subTasks, newSubTask],
      };
      
      return {
        ...prev,
        tasks: {
          ...prev.tasks,
          [taskId]: updatedTask,
        },
      };
    });
  };

  const updateSubTask = (taskId: string, subTaskId: string, updates: Partial<SubTask>) => {
    setBoard((prev) => {
      const task = prev.tasks[taskId];
      
      if (!task) return prev;
      
      const updatedSubTasks = task.subTasks.map((subTask) =>
        subTask.id === subTaskId ? { ...subTask, ...updates } : subTask
      );
      
      const updatedTask = {
        ...task,
        subTasks: updatedSubTasks,
      };
      
      return {
        ...prev,
        tasks: {
          ...prev.tasks,
          [taskId]: updatedTask,
        },
      };
    });
  };

  const deleteSubTask = (taskId: string, subTaskId: string) => {
    setBoard((prev) => {
      const task = prev.tasks[taskId];
      
      if (!task) return prev;
      
      const updatedSubTasks = task.subTasks.filter((subTask) => subTask.id !== subTaskId);
      
      const updatedTask = {
        ...task,
        subTasks: updatedSubTasks,
      };
      
      return {
        ...prev,
        tasks: {
          ...prev.tasks,
          [taskId]: updatedTask,
        },
      };
    });
  };

  const createTag = (name: string, color: string) => {
    const newTagId = uuidv4();
    const newTag: TaskTag = {
      id: newTagId,
      name,
      color,
    };
    
    setTags((prev) => [...prev, newTag]);
    
    return newTag;
  };

  const deleteTag = (tagId: string) => {
    setTags((prev) => prev.filter((tag) => tag.id !== tagId));
    
    // Also remove the tag from all tasks
    setBoard((prev) => {
      const updatedTasks: Record<string, Task> = {};
      
      Object.keys(prev.tasks).forEach((taskId) => {
        const task = prev.tasks[taskId];
        updatedTasks[taskId] = {
          ...task,
          tags: task.tags.filter((tag) => tag.id !== tagId),
        };
      });
      
      return {
        ...prev,
        tasks: updatedTasks,
      };
    });
  };

  const moveTask = async (
    taskId: string,
    sourceColumnId: string,
    destinationColumnId: string,
    _newIndex: number
  ) => {
    // Update task status if moving between columns
    if (sourceColumnId !== destinationColumnId) {
      const newStatus = columnToStatusMap[destinationColumnId];
      await updateTask(taskId, { status: newStatus });
    }
    // If moving within the same column, we don't need to update the server
    // as the position doesn't affect the task data
  };

  const bulkUpdateTasks = async (taskIds: string[], action: string, updates?: any) => {
    try {
      const token = await getAuthToken();
      const response = await fetch("/api/tasks/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, taskIds, updates }),
      });
      
      if (response.ok) {
        await fetchTasks();
      } else {
        throw new Error("Failed to bulk update tasks");
      }
    } catch (error) {
      console.error("Error bulk updating tasks:", error);
      throw error;
    }
  };

  const assignTasksToSelf = async (taskIds: string[]) => {
    if (!user) return;
    await bulkUpdateTasks(taskIds, "assign", { assignToUserId: user.uid });
  };

  const completeAllTasks = async (taskIds: string[]) => {
    await bulkUpdateTasks(taskIds, "complete");
  };

  const value = {
    board,
    tags,
    users,
    loading,
    filter,
    setFilter,
    createTask,
    updateTask,
    deleteTask,
    createSubTask,
    updateSubTask,
    deleteSubTask,
    createTag,
    deleteTag,
    moveTask,
    refreshTasks: fetchTasks,
    bulkUpdateTasks,
    assignTasksToSelf,
    completeAllTasks,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export function useTaskContext() {
  const context = useContext(TaskContext);
  
  if (!context) {
    throw new Error("useTaskContext must be used within a TaskProvider");
  }
  
  return context;
} 