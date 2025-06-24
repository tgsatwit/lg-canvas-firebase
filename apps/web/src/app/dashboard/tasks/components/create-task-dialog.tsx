"use client";

import { useState } from "react";
import { Task, TaskTag } from "../context/task-context";
import { useTaskContext } from "../context/task-context";
import { Tag, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type RecurringPattern = "daily" | "weekly" | "monthly";

interface CreateTaskDialogProps {
  open: boolean;
  initialStatus?: Task["status"];
  onOpenChange: (open: boolean) => void;
}

export function CreateTaskDialog({
  open,
  initialStatus = "todo",
  onOpenChange,
}: CreateTaskDialogProps) {
  const { createTask, tags } = useTaskContext();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Task["status"]>(initialStatus);
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [dueDate, setDueDate] = useState("");
  const [selectedTags, setSelectedTags] = useState<TaskTag[]>([]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringPattern, setRecurringPattern] = useState<RecurringPattern>("weekly");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ title?: string }>({});
  
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStatus(initialStatus);
    setPriority("medium");
    setDueDate("");
    setSelectedTags([]);
    setIsRecurring(false);
    setRecurringPattern("weekly");
    setErrors({});
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: { title?: string } = {};
    
    if (!title.trim()) {
      newErrors.title = "Title is required";
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      createTask({
        title,
        description,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        tags: selectedTags,
        isRecurring,
        recurringPattern: isRecurring ? recurringPattern : undefined,
        subTasks: [],
      });
      
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancel = () => {
    resetForm();
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
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={errors.title ? "border-red-500" : ""}
              placeholder="Task title"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Task description"
              className="min-h-[100px]"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as Task["status"])}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(value) => setPriority(value as Task["priority"])}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
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
            </div>
          </div>
          
          <div>
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          
          <div>
            <Label>Tags</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start mt-1"
                  type="button"
                >
                  <Tag className="h-4 w-4 mr-1" />
                  {selectedTags.length > 0
                    ? `${selectedTags.length} tags selected`
                    : "Select tags"}
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
            
            <div className="flex flex-wrap gap-1 mt-2">
              {selectedTags.map((tag) => (
                <Badge key={tag.id} variant="outline" className={`${tag.color} bg-opacity-10 cursor-pointer`} onClick={() => toggleTagSelection(tag.id)}>
                  {tag.name} &times;
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isRecurring"
                checked={isRecurring}
                onCheckedChange={(checked) => setIsRecurring(!!checked)}
              />
              <Label htmlFor="isRecurring">Recurring Task</Label>
            </div>
            
            {isRecurring && (
              <div>
                <Label htmlFor="recurringPattern">Recurring Pattern</Label>
                <Select
                  value={recurringPattern}
                  onValueChange={(value) => setRecurringPattern(value as RecurringPattern)}
                >
                  <SelectTrigger id="recurringPattern">
                    <SelectValue placeholder="Select pattern" />
                  </SelectTrigger>
                  <SelectContent>
                    {recurringOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 