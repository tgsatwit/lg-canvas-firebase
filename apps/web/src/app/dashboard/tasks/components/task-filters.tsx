"use client";

import { useTaskContext } from "../context/task-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Users, Filter } from "lucide-react";

export function TaskFilters() {
  const { filter, setFilter, board, loading } = useTaskContext();

  const getTaskCounts = () => {
    const tasks = Object.values(board.tasks);
    const totalTasks = tasks.length;
    const ownedTasks = tasks.filter(task => task.createdBy === task.createdBy).length; // This will be updated when we have user context
    const assignedTasks = tasks.filter(task => task.assignedTo).length;
    
    return {
      all: totalTasks,
      owned: ownedTasks,
      assigned: assignedTasks,
    };
  };

  const counts = getTaskCounts();

  const filterOptions = [
    {
      key: "all" as const,
      label: "All Tasks",
      icon: <Filter className="h-4 w-4" />,
      count: counts.all,
    },
    {
      key: "owned" as const,
      label: "My Tasks",
      icon: <User className="h-4 w-4" />,
      count: counts.owned,
    },
    {
      key: "assigned" as const,
      label: "Assigned to Me",
      icon: <Users className="h-4 w-4" />,
      count: counts.assigned,
    },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filterOptions.map((option) => (
        <Button
          key={option.key}
          variant={filter === option.key ? "default" : "outline"}
          onClick={() => setFilter(option.key)}
          disabled={loading}
          className="flex items-center gap-2"
        >
          {option.icon}
          <span>{option.label}</span>
          <Badge
            variant={filter === option.key ? "secondary" : "outline"}
            className="ml-1"
          >
            {option.count}
          </Badge>
        </Button>
      ))}
    </div>
  );
}