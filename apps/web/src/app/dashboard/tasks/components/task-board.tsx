"use client";

import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useTaskContext } from "../context/task-context";
import { TaskCard } from "./task-card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateTaskDialog } from "./create-task-dialog";
import { Column, Task } from "../context/task-context";

interface TaskBoardProps {
  searchQuery?: string;
}

export function TaskBoard({ searchQuery = "" }: TaskBoardProps) {
  const { board, moveTask } = useTaskContext();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);

  // Filter tasks based on search query
  const filteredBoard = {
    ...board,
    columns: Object.entries(board.columns).reduce<Record<string, Column>>(
      (acc, [columnId, column]) => {
        const filteredTaskIds = column.taskIds.filter((taskId) => {
          const task = board.tasks[taskId];
          if (!task) return false;
          
          const searchTerms = searchQuery.toLowerCase();
          return (
            task.title.toLowerCase().includes(searchTerms) ||
            task.description.toLowerCase().includes(searchTerms) ||
            task.tags.some((tag) => tag.name.toLowerCase().includes(searchTerms))
          );
        });
        
        return {
          ...acc,
          [columnId]: {
            ...column,
            taskIds: filteredTaskIds,
          },
        };
      },
      {}
    ),
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    
    // Dropped outside the list
    if (!destination) {
      return;
    }
    
    // Dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }
    
    moveTask(
      draggableId,
      source.droppableId,
      destination.droppableId,
      destination.index
    );
  };

  const handleAddTask = (columnId: string) => {
    setSelectedColumn(columnId);
    setIsCreateDialogOpen(true);
  };

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {board.columnOrder.map((columnId) => {
            const column = filteredBoard.columns[columnId];
            const tasks = column?.taskIds.map((taskId) => board.tasks[taskId]).filter(Boolean) as Task[] || [];
            
            return (
              <div
                key={columnId}
                className="bg-slate-50 rounded-xl p-4 border border-slate-200"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-md font-semibold text-slate-700">
                    {column?.title || ""}{" "}
                    <span className="ml-1 text-slate-400">({column?.taskIds.length || 0})</span>
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleAddTask(columnId)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <Droppable droppableId={columnId}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-3 min-h-[200px] transition-colors ${
                        snapshot.isDraggingOver
                          ? "bg-slate-100"
                          : "bg-transparent"
                      }`}
                    >
                      {tasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                              }}
                            >
                              <TaskCard task={task} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
      
      {isCreateDialogOpen && (
        <CreateTaskDialog
          open={isCreateDialogOpen}
          initialStatus={selectedColumn === "column-1" ? "todo" :
                         selectedColumn === "column-2" ? "in-progress" :
                         selectedColumn === "column-3" ? "review" : "done"}
          onOpenChange={setIsCreateDialogOpen}
        />
      )}
    </>
  );
} 