"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Clock, CheckCircle2, ArrowRightCircle } from "lucide-react";
import { useTaskContext } from "../context/task-context";
import { Task, SubTask } from "../context/task-context";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { TaskDetailsDialog } from "./task-details-dialog";

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const { updateSubTask } = useTaskContext();
  const [showDetails, setShowDetails] = useState(false);
  
  // Calculate completion progress
  const totalSubTasks = task.subTasks.length;
  const completedSubTasks = task.subTasks.filter((subTask) => subTask.completed).length;
  const progress = totalSubTasks > 0 ? (completedSubTasks / totalSubTasks) * 100 : 0;
  
  const priorityColorMap = {
    high: "text-red-500",
    medium: "text-amber-500",
    low: "text-green-500",
  };
  
  const handleSubTaskToggle = (subTask: SubTask) => {
    updateSubTask(task.id, subTask.id, { completed: !subTask.completed });
  };
  
  return (
    <>
      <div 
        className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => setShowDetails(true)}
      >
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <h4 className="text-sm font-medium text-slate-800">{task.title}</h4>
            <div className={`text-xs font-medium ${priorityColorMap[task.priority]}`}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </div>
          </div>
          
          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.map((tag) => (
                <Badge key={tag.id} variant="outline" className={`${tag.color} bg-opacity-10 text-xs`}>
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
          
          {task.description && (
            <p className="text-xs text-slate-500 line-clamp-2">{task.description}</p>
          )}
          
          {task.dueDate && (
            <div className="flex items-center text-xs text-slate-400">
              <Clock className="h-3 w-3 mr-1" />
              {format(new Date(task.dueDate), "MMM d, yyyy")}
            </div>
          )}
          
          {totalSubTasks > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">
                  {completedSubTasks} of {totalSubTasks} subtasks
                </span>
                <span className="text-slate-500">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-1" />
            </div>
          )}
          
          {task.isRecurring && (
            <div className="flex items-center text-xs text-indigo-500">
              <ArrowRightCircle className="h-3 w-3 mr-1" />
              Recurring {task.recurringPattern}
            </div>
          )}
          
          {/* Preview of subtasks (max 2) */}
          {task.subTasks.length > 0 && (
            <div className="space-y-1 pt-1">
              {task.subTasks.slice(0, 2).map((subTask) => (
                <div 
                  key={subTask.id} 
                  className="flex items-start gap-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSubTaskToggle(subTask);
                  }}
                >
                  <Checkbox 
                    id={`subtask-${subTask.id}`}
                    checked={subTask.completed}
                    className="mt-0.5"
                  />
                  <label 
                    htmlFor={`subtask-${subTask.id}`}
                    className={`${
                      subTask.completed ? "line-through text-slate-400" : "text-slate-600"
                    }`}
                  >
                    {subTask.title}
                  </label>
                </div>
              ))}
              {task.subTasks.length > 2 && (
                <div className="text-xs text-slate-400">
                  +{task.subTasks.length - 2} more subtasks
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {showDetails && (
        <TaskDetailsDialog
          task={task}
          open={showDetails}
          onOpenChange={setShowDetails}
        />
      )}
    </>
  );
} 