"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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
  tags: TaskTag[];
  assignedTo?: string;
  isRecurring: boolean;
  recurringPattern?: "daily" | "weekly" | "monthly";
  subTasks: SubTask[];
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
  createTask: (task: Omit<Task, "id" | "createdAt">) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  createSubTask: (taskId: string, title: string) => void;
  updateSubTask: (taskId: string, subTaskId: string, updates: Partial<SubTask>) => void;
  deleteSubTask: (taskId: string, subTaskId: string) => void;
  createTag: (name: string, color: string) => TaskTag;
  deleteTag: (tagId: string) => void;
  moveTask: (taskId: string, sourceColumn: string, destinationColumn: string, newIndex: number) => void;
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

  // Load data from localStorage on component mount
  useEffect(() => {
    try {
      const storedBoard = localStorage.getItem("taskBoard");
      const storedTags = localStorage.getItem("taskTags");
      
      if (storedBoard) {
        setBoard(JSON.parse(storedBoard));
      }
      
      if (storedTags) {
        setTags(JSON.parse(storedTags));
      }
    } catch (error) {
      console.error("Error loading data from localStorage:", error);
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("taskBoard", JSON.stringify(board));
      localStorage.setItem("taskTags", JSON.stringify(tags));
    } catch (error) {
      console.error("Error saving data to localStorage:", error);
    }
  }, [board, tags]);

  const createTask = (taskData: Omit<Task, "id" | "createdAt">) => {
    const newTaskId = uuidv4();
    
    const columnId = statusToColumnMap[taskData.status];
    
    const newTask: Task = {
      id: newTaskId,
      ...taskData,
      createdAt: new Date().toISOString(),
    };
    
    setBoard((prev) => {
      // Add task to tasks object
      const updatedTasks = {
        ...prev.tasks,
        [newTaskId]: newTask,
      };
      
      // Add task ID to the appropriate column
      const updatedColumn = {
        ...prev.columns[columnId],
        taskIds: [...prev.columns[columnId].taskIds, newTaskId],
      };
      
      // Update columns object
      const updatedColumns = {
        ...prev.columns,
        [columnId]: updatedColumn,
      };
      
      return {
        ...prev,
        tasks: updatedTasks,
        columns: updatedColumns,
      };
    });
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setBoard((prev) => {
      // Update the task
      const updatedTask = {
        ...prev.tasks[taskId],
        ...updates,
      };
      
      // Update tasks object
      const updatedTasks = {
        ...prev.tasks,
        [taskId]: updatedTask,
      };
      
      // Handle status change by moving task to correct column
      if (updates.status && updates.status !== prev.tasks[taskId].status) {
        const oldStatus = prev.tasks[taskId].status;
        const newStatus = updates.status;
        
        const sourceColumnId = statusToColumnMap[oldStatus];
        const destinationColumnId = statusToColumnMap[newStatus];
        
        // Remove from source column
        const sourceColumn = {
          ...prev.columns[sourceColumnId],
          taskIds: prev.columns[sourceColumnId].taskIds.filter((id) => id !== taskId),
        };
        
        // Add to destination column
        const destinationColumn = {
          ...prev.columns[destinationColumnId],
          taskIds: [...prev.columns[destinationColumnId].taskIds, taskId],
        };
        
        // Update columns
        const updatedColumns = {
          ...prev.columns,
          [sourceColumnId]: sourceColumn,
          [destinationColumnId]: destinationColumn,
        };
        
        return {
          ...prev,
          tasks: updatedTasks,
          columns: updatedColumns,
        };
      }
      
      return {
        ...prev,
        tasks: updatedTasks,
      };
    });
  };

  const deleteTask = (taskId: string) => {
    setBoard((prev) => {
      // Find the column containing this task
      const columnId = Object.keys(prev.columns).find((columnId) =>
        prev.columns[columnId].taskIds.includes(taskId)
      );
      
      if (!columnId) return prev;
      
      // Create new tasks object without the deleted task
      const { [taskId]: deletedTask, ...remainingTasks } = prev.tasks;
      
      // Remove task ID from the column
      const updatedColumn = {
        ...prev.columns[columnId],
        taskIds: prev.columns[columnId].taskIds.filter((id) => id !== taskId),
      };
      
      // Update columns object
      const updatedColumns = {
        ...prev.columns,
        [columnId]: updatedColumn,
      };
      
      return {
        ...prev,
        tasks: remainingTasks,
        columns: updatedColumns,
      };
    });
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

  const moveTask = (
    taskId: string,
    sourceColumnId: string,
    destinationColumnId: string,
    newIndex: number
  ) => {
    setBoard((prev) => {
      // Remove from source column
      const sourceColumn = prev.columns[sourceColumnId];
      const newSourceTaskIds = Array.from(sourceColumn.taskIds);
      const sourceIndex = newSourceTaskIds.indexOf(taskId);
      newSourceTaskIds.splice(sourceIndex, 1);
      
      // Add to destination column
      const destinationColumn = prev.columns[destinationColumnId];
      const newDestinationTaskIds = Array.from(destinationColumn.taskIds);
      newDestinationTaskIds.splice(newIndex, 0, taskId);
      
      // Update columns
      const updatedColumns = {
        ...prev.columns,
        [sourceColumnId]: {
          ...sourceColumn,
          taskIds: newSourceTaskIds,
        },
        [destinationColumnId]: {
          ...destinationColumn,
          taskIds: newDestinationTaskIds,
        },
      };
      
      // Update task status if moving between columns
      let updatedTasks = { ...prev.tasks };
      
      if (sourceColumnId !== destinationColumnId) {
        const newStatus = columnToStatusMap[destinationColumnId];
        
        updatedTasks = {
          ...updatedTasks,
          [taskId]: {
            ...updatedTasks[taskId],
            status: newStatus,
          },
        };
      }
      
      return {
        ...prev,
        tasks: updatedTasks,
        columns: updatedColumns,
      };
    });
  };

  const value = {
    board,
    tags,
    createTask,
    updateTask,
    deleteTask,
    createSubTask,
    updateSubTask,
    deleteSubTask,
    createTag,
    deleteTag,
    moveTask,
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