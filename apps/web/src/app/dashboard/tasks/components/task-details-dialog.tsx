"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Task, SubTask } from "../context/task-context";
import { useTaskContext } from "../context/task-context";
import { Calendar, Tag, Trash2, Plus, Check, AlertCircle } from "lucide-react";
import { UserSelector } from "./user-selector";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type RecurringPattern = "daily" | "weekly" | "monthly";

interface TaskDetailsDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailsDialog({
  task,
  open,
  onOpenChange,
}: TaskDetailsDialogProps) {
  const { updateTask, deleteTask, createSubTask, updateSubTask, deleteSubTask, tags } = useTaskContext();
  
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [status, setStatus] = useState<Task["status"]>(task.status);
  const [priority, setPriority] = useState<Task["priority"]>(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate || "");
  const [selectedTags, setSelectedTags] = useState(task.tags);
  const [assignedTo, setAssignedTo] = useState(task.assignedTo);
  const [isRecurring, setIsRecurring] = useState(task.isRecurring);
  const [recurringPattern, setRecurringPattern] = useState<RecurringPattern>(
    (task.recurringPattern as RecurringPattern) || "daily"
  );
  const [newSubTaskTitle, setNewSubTaskTitle] = useState("");
  
  // Calculate completion progress
  const totalSubTasks = task.subTasks.length;
  const completedSubTasks = task.subTasks.filter((subTask) => subTask.completed).length;
  const progress = totalSubTasks > 0 ? (completedSubTasks / totalSubTasks) * 100 : 0;
  
  const handleSaveChanges = async () => {
    await updateTask(task.id, {
      title,
      description,
      status,
      priority,
      dueDate: dueDate || undefined,
      tags: selectedTags,
      assignedTo,
      isRecurring,
      recurringPattern: isRecurring ? recurringPattern : undefined,
    });
    
    setIsEditing(false);
  };
  
  const handleAddSubTask = () => {
    if (newSubTaskTitle.trim()) {
      createSubTask(task.id, newSubTaskTitle.trim());
      setNewSubTaskTitle("");
    }
  };
  
  const handleSubTaskToggle = (subTask: SubTask) => {
    updateSubTask(task.id, subTask.id, { completed: !subTask.completed });
  };
  
  const handleDeleteSubTask = (subTaskId: string) => {
    deleteSubTask(task.id, subTaskId);
  };
  
  const handleDeleteTask = () => {
    deleteTask(task.id);
    onOpenChange(false);
  };
  
  const toggleTagSelection = (tagId: string) => {
    const isSelected = selectedTags.some((tag) => tag.id === tagId);
    
    if (isSelected) {
      setSelectedTags(selectedTags.filter((tag) => tag.id !== tagId));
    } else {
      const tagToAdd = tags.find((tag) => tag.id === tagId);
      if (tagToAdd) {
        setSelectedTags([...selectedTags, tagToAdd]);
      }
    }
  };
  
  const statusOptions = [
    { value: "todo", label: "To Do" },
    { value: "in-progress", label: "In Progress" },
    { value: "review", label: "Review" },
    { value: "done", label: "Done" },
  ];
  
  const priorityOptions = [
    { value: "low", label: "Low", icon: <div className="h-2 w-2 rounded-full bg-green-500 mr-2" /> },
    { value: "medium", label: "Medium", icon: <div className="h-2 w-2 rounded-full bg-amber-500 mr-2" /> },
    { value: "high", label: "High", icon: <div className="h-2 w-2 rounded-full bg-red-500 mr-2" /> },
  ];
  
  const recurringOptions = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
  ];
  
  const priorityColorMap = {
    high: "text-red-500",
    medium: "text-amber-500",
    low: "text-green-500",
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="mr-8">
              {isEditing ? (
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-7 text-lg font-medium"
                />
              ) : (
                <span className="text-lg text-slate-800">{task.title}</span>
              )}
            </DialogTitle>
            
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleDeleteTask}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveChanges}>
                    Save
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="space-y-4 col-span-2">
            <Tabs defaultValue="details">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="subtasks">
                  Subtasks ({completedSubTasks}/{totalSubTasks})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4 mt-4">
                <div>
                  <Label>Description</Label>
                  {isEditing ? (
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="mt-1"
                      placeholder="Task description..."
                    />
                  ) : (
                    <div className="text-sm text-slate-700 mt-1">
                      {task.description || <span className="text-slate-400 italic">No description</span>}
                    </div>
                  )}
                </div>
                
                {task.subTasks.length > 0 && (
                  <div className="space-y-1">
                    <Label>Progress</Label>
                    <div className="flex justify-between items-center text-xs text-slate-500">
                      <span>
                        {completedSubTasks} of {totalSubTasks} subtasks
                      </span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Status</Label>
                    {isEditing ? (
                      <Select
                        value={status}
                        onValueChange={(value) => setStatus(value as Task["status"])}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm text-slate-700 mt-1">
                        {statusOptions.find((opt) => opt.value === task.status)?.label}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label>Priority</Label>
                    {isEditing ? (
                      <Select
                        value={priority}
                        onValueChange={(value) => setPriority(value as Task["priority"])}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {priorityOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center">
                                {option.icon}
                                {option.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className={`text-sm mt-1 ${priorityColorMap[task.priority]}`}>
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label>Due Date</Label>
                  {isEditing ? (
                    <div className="flex items-center mt-1">
                      <Input
                        type="date"
                        value={dueDate ? dueDate.split("T")[0] : ""}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : null;
                          setDueDate(date ? date.toISOString() : "");
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center text-sm text-slate-700 mt-1">
                      {task.dueDate ? (
                        <>
                          <Calendar className="h-4 w-4 mr-1" />
                          {format(new Date(task.dueDate), "MMMM d, yyyy")}
                        </>
                      ) : (
                        <span className="text-slate-400 italic">No due date</span>
                      )}
                    </div>
                  )}
                </div>
                
                <div>
                  <Label>Tags</Label>
                  {isEditing ? (
                    <div className="mt-1">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <Tag className="h-4 w-4 mr-1" />
                            {selectedTags.length > 0
                              ? `${selectedTags.length} tags selected`
                              : "No tags selected"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <div className="p-2">
                            {tags.map((tag) => {
                              const isSelected = selectedTags.some(
                                (selectedTag) => selectedTag.id === tag.id
                              );
                              return (
                                <div
                                  key={tag.id}
                                  className={cn(
                                    "flex items-center p-2 rounded-md cursor-pointer",
                                    isSelected ? "bg-slate-100" : ""
                                  )}
                                  onClick={() => toggleTagSelection(tag.id)}
                                >
                                  <div
                                    className={`h-3 w-3 rounded-full ${tag.color} mr-2`}
                                  />
                                  <span className="text-sm">{tag.name}</span>
                                  {isSelected && (
                                    <Check className="h-4 w-4 ml-auto text-green-600" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {task.tags.length > 0 ? (
                        task.tags.map((tag) => (
                          <Badge key={tag.id} variant="outline" className={`${tag.color} bg-opacity-10`}>
                            {tag.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-slate-400 italic">No tags</span>
                      )}
                    </div>
                  )}
                </div>
                
                <div>
                  <Label>Assigned To</Label>
                  {isEditing ? (
                    <div className="mt-1">
                      <UserSelector
                        selectedUserId={assignedTo}
                        onUserSelect={setAssignedTo}
                        placeholder="Assign to user"
                      />
                    </div>
                  ) : (
                    <div className="text-sm text-slate-700 mt-1">
                      {task.assignedTo ? (
                        <span>Assigned to user</span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </div>
                  )}
                </div>
                
                <div>
                  <div className="flex items-center justify-between">
                    <Label>Recurring Task</Label>
                    {isEditing && (
                      <Checkbox
                        checked={isRecurring}
                        onCheckedChange={(checked) => setIsRecurring(!!checked)}
                      />
                    )}
                  </div>
                  
                  {isEditing && isRecurring ? (
                    <Select
                      value={recurringPattern}
                      onValueChange={(value) => setRecurringPattern(value as RecurringPattern)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {recurringOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    task.isRecurring && (
                      <div className="flex items-center text-sm text-indigo-600 mt-1">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Recurring {task.recurringPattern}
                      </div>
                    )
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="subtasks" className="space-y-4 mt-4">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Add a new subtask..."
                    value={newSubTaskTitle}
                    onChange={(e) => setNewSubTaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddSubTask();
                      }
                    }}
                  />
                  <Button onClick={handleAddSubTask}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {task.subTasks.length > 0 ? (
                    task.subTasks.map((subTask) => (
                      <div
                        key={subTask.id}
                        className="flex items-start justify-between gap-2 py-2 border-b border-slate-100"
                      >
                        <div className="flex items-start gap-2">
                          <Checkbox
                            id={`detail-subtask-${subTask.id}`}
                            checked={subTask.completed}
                            onCheckedChange={() => handleSubTaskToggle(subTask)}
                            className="mt-0.5"
                          />
                          <label
                            htmlFor={`detail-subtask-${subTask.id}`}
                            className={`text-sm ${
                              subTask.completed
                                ? "line-through text-slate-400"
                                : "text-slate-700"
                            }`}
                          >
                            {subTask.title}
                          </label>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleDeleteSubTask(subTask.id)}
                        >
                          <Trash2 className="h-3 w-3 text-slate-400" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-sm text-slate-400">
                      No subtasks added yet. Add one above.
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="space-y-4 text-sm">
            <div>
              <Label className="text-xs">Created</Label>
              <div className="text-slate-600 mt-1">
                {format(new Date(task.createdAt), "MMM d, yyyy")}
              </div>
            </div>
            
            {task.assignedTo && (
              <div>
                <Label className="text-xs">Assigned To</Label>
                <div className="text-slate-600 mt-1">{task.assignedTo}</div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 