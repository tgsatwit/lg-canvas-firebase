"use client"

import * as React from "react"
import {
  add,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isEqual,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
  startOfToday,
  startOfWeek,
} from "date-fns"
import {
  ChevronLeft,
  ChevronRight,
  PlusCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// Temporarily removed Select import due to module issues
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select"
import { cn } from "@/lib/utils"

// Media Query Hook
function useMediaQuery(query: string) {
  const [value, setValue] = React.useState(false)

  React.useEffect(() => {
    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches)
    }

    const result = matchMedia(query)
    result.addEventListener("change", onChange)
    setValue(result.matches)

    return () => result.removeEventListener("change", onChange)
  }, [query])

  return value
}

// Event Types
interface Event {
  id: number
  name: string
  time: string
  datetime: string
  type?: 'task' | 'event' | 'reminder'
}

interface CalendarData {
  day: Date
  events: Event[]
}

interface DashboardCalendarProps {
  data: CalendarData[]
  onAddEvent?: (date: Date) => void
  onAddTask?: (date: Date) => void
}

// Column Start Classes for Calendar Grid
const colStartClasses = [
  "",
  "col-start-2",
  "col-start-3",
  "col-start-4",
  "col-start-5",
  "col-start-6",
  "col-start-7",
]

// Event Type Colors
const eventTypeColors = {
  task: "bg-pink-500",
  event: "bg-pink-500",
  reminder: "bg-pink-500",
  default: "bg-pink-500"
}

// Add Event Form Component
function AddEventForm({ date, onClose, onAddTask }: { 
  date: Date, 
  onClose: () => void,
  onAddTask?: (date: Date) => void 
}) {
  const [eventName, setEventName] = React.useState("")
  const [eventTime, setEventTime] = React.useState("12:00")
  const [eventType, setEventType] = React.useState<"task" | "event" | "reminder">("event")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (eventType === "task" && onAddTask) {
      onAddTask(date)
    } else {
      // Handle other event types
      console.log("New event:", { date, name: eventName, time: eventTime, type: eventType })
    }
    
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="event-name">Event Name</Label>
        <Input
          id="event-name"
          type="text"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          placeholder="Enter event name"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="event-time">Time</Label>
        <Input
          id="event-time"
          type="time"
          value={eventTime}
          onChange={(e) => setEventTime(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="event-type">Event Type</Label>
        <select
          id="event-type"
          value={eventType}
          onChange={(e) => setEventType(e.target.value as "task" | "event" | "reminder")}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
        >
          <option value="task">Task</option>
          <option value="event">Event</option>
          <option value="reminder">Reminder</option>
        </select>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          Add {eventType === "task" ? "Task" : "Event"}
        </Button>
      </div>
    </form>
  )
}

// Main Calendar Component
export function DashboardCalendar({ data, onAddEvent, onAddTask }: DashboardCalendarProps) {
  const today = startOfToday()
  const [selectedDay, setSelectedDay] = React.useState(today)
  const [currentMonth, setCurrentMonth] = React.useState(
    format(today, "MMM-yyyy"),
  )
  const [isAddEventOpen, setIsAddEventOpen] = React.useState(false)
  
  const firstDayCurrentMonth = parse(currentMonth, "MMM-yyyy", new Date())
  const isDesktop = useMediaQuery("(min-width: 768px)")

  const days = eachDayOfInterval({
    start: startOfWeek(firstDayCurrentMonth),
    end: endOfWeek(endOfMonth(firstDayCurrentMonth)),
  })

  function previousMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: -1 })
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"))
  }

  function nextMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 })
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"))
  }

  function goToToday() {
    setCurrentMonth(format(today, "MMM-yyyy"))
    setSelectedDay(today)
  }
  
  function handleAddEvent(day: Date) {
    setSelectedDay(day)
    setIsAddEventOpen(true)
    if (onAddEvent) {
      onAddEvent(day)
    }
  }

  return (
    <div className="flex flex-1 flex-col rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Calendar Header */}
      <div className="flex flex-col space-y-4 p-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex flex-auto">
          <div className="flex items-center gap-4">
            <div className="hidden w-20 flex-col items-center justify-center rounded-lg border bg-gray-50 p-0.5 md:flex">
              <h1 className="p-1 text-xs uppercase text-gray-500">
                {format(today, "MMM")}
              </h1>
              <div className="flex w-full items-center justify-center rounded-lg border bg-white p-0.5 text-lg font-bold">
                <span>{format(today, "d")}</span>
              </div>
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold text-gray-900">
                {format(firstDayCurrentMonth, "MMMM yyyy")}
              </h2>
              <p className="text-sm text-gray-500">
                {format(firstDayCurrentMonth, "MMM d, yyyy")} -{" "}
                {format(endOfMonth(firstDayCurrentMonth), "MMM d, yyyy")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-6">
          <div className="inline-flex w-full -space-x-px rounded-lg shadow-sm md:w-auto">
            <Button
              onClick={previousMonth}
              className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10"
              variant="outline"
              size="icon"
              aria-label="Navigate to previous month"
            >
              <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
            </Button>
            <Button
              onClick={goToToday}
              className="w-full rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 md:w-auto"
              variant="outline"
            >
              Today
            </Button>
            <Button
              onClick={nextMonth}
              className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10"
              variant="outline"
              size="icon"
              aria-label="Navigate to next month"
            >
              <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
            </Button>
          </div>

          <Separator orientation="vertical" className="hidden h-6 md:block" />

          <Button 
            className="w-full gap-2 md:w-auto bg-pink-600 hover:bg-pink-700"
            onClick={() => handleAddEvent(selectedDay)}
          >
            <PlusCircle size={16} strokeWidth={2} aria-hidden="true" />
            <span>New Event</span>
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="lg:flex lg:flex-auto lg:flex-col">
        {/* Week Days Header */}
        <div className="grid grid-cols-7 border-y border-gray-200 text-center text-xs font-semibold leading-6 text-gray-500 lg:flex-none">
          <div className="border-r border-gray-200 py-2.5">Sun</div>
          <div className="border-r border-gray-200 py-2.5">Mon</div>
          <div className="border-r border-gray-200 py-2.5">Tue</div>
          <div className="border-r border-gray-200 py-2.5">Wed</div>
          <div className="border-r border-gray-200 py-2.5">Thu</div>
          <div className="border-r border-gray-200 py-2.5">Fri</div>
          <div className="py-2.5">Sat</div>
        </div>

        {/* Calendar Days - Desktop View */}
        <div className="flex text-xs leading-6 lg:flex-auto">
          <div className="hidden w-full border-x border-gray-200 lg:grid lg:grid-cols-7 lg:grid-rows-5">
            {days.map((day, dayIdx) => (
              <div
                key={dayIdx}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  dayIdx === 0 && colStartClasses[getDay(day)],
                  !isEqual(day, selectedDay) &&
                    !isToday(day) &&
                    !isSameMonth(day, firstDayCurrentMonth) &&
                    "bg-gray-50 text-gray-400",
                  "relative flex flex-col border-b border-r border-gray-200 hover:bg-gray-50 focus:z-10 cursor-pointer group",
                  isEqual(day, selectedDay) && "bg-pink-50",
                  isToday(day) && !isEqual(day, selectedDay) && "bg-yellow-50"
                )}
              >
                <header className="flex items-center justify-between p-2.5">
                  <button
                    type="button"
                    className={cn(
                      isEqual(day, selectedDay) && "text-white",
                      !isEqual(day, selectedDay) &&
                        !isToday(day) &&
                        isSameMonth(day, firstDayCurrentMonth) &&
                        "text-gray-900",
                      !isEqual(day, selectedDay) &&
                        !isToday(day) &&
                        !isSameMonth(day, firstDayCurrentMonth) &&
                        "text-gray-400",
                      isEqual(day, selectedDay) &&
                        isToday(day) &&
                        "border-none bg-pink-600",
                      isEqual(day, selectedDay) &&
                        !isToday(day) &&
                        "bg-pink-600 text-white",
                      isToday(day) && !isEqual(day, selectedDay) && "border border-pink-600 text-pink-600",
                      "flex h-7 w-7 items-center justify-center rounded-full text-xs hover:border"
                    )}
                  >
                    <time dateTime={format(day, "yyyy-MM-dd")}>
                      {format(day, "d")}
                    </time>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAddEvent(day)
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-pink-600 transition-opacity"
                  >
                    <PlusCircle size={14} />
                  </button>
                </header>
                <div className="flex-1 p-2.5">
                  {data
                    .filter((event) => isSameDay(event.day, day))
                    .map((dayData) => (
                      <div key={dayData.day.toString()} className="space-y-1.5">
                        {dayData.events.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            className="flex flex-col items-start gap-1 rounded-lg border border-gray-200 bg-gray-50 p-2 text-xs leading-tight"
                          >
                            <div className="flex items-center w-full">
                              <span className={cn(
                                "h-2 w-2 rounded-full mr-1.5",
                                event.type ? eventTypeColors[event.type] : eventTypeColors.default
                              )} />
                              <p className="font-medium leading-none truncate flex-1">
                                {event.name}
                              </p>
                            </div>
                            <p className="leading-none text-gray-500">
                              {event.time}
                            </p>
                          </div>
                        ))}
                        {dayData.events.length > 2 && (
                          <div className="text-xs text-gray-500">
                            + {dayData.events.length - 2} more
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {/* Calendar Days - Mobile View */}
          <div className="isolate grid w-full grid-cols-7 grid-rows-5 border-x border-gray-200 lg:hidden">
            {days.map((day, dayIdx) => (
              <button
                onClick={() => setSelectedDay(day)}
                key={dayIdx}
                type="button"
                className={cn(
                  isEqual(day, selectedDay) && "text-white",
                  !isEqual(day, selectedDay) &&
                    !isToday(day) &&
                    isSameMonth(day, firstDayCurrentMonth) &&
                    "text-gray-900",
                  !isEqual(day, selectedDay) &&
                    !isToday(day) &&
                    !isSameMonth(day, firstDayCurrentMonth) &&
                    "text-gray-400",
                  (isEqual(day, selectedDay) || isToday(day)) &&
                    "font-semibold",
                  "flex h-14 flex-col border-b border-r border-gray-200 px-3 py-2 hover:bg-gray-50 focus:z-10",
                  isEqual(day, selectedDay) && "bg-pink-50"
                )}
              >
                <time
                  dateTime={format(day, "yyyy-MM-dd")}
                  className={cn(
                    "ml-auto flex size-6 items-center justify-center rounded-full",
                    isEqual(day, selectedDay) &&
                      isToday(day) &&
                      "bg-pink-600 text-white",
                    isEqual(day, selectedDay) &&
                      !isToday(day) &&
                      "bg-pink-600 text-white",
                    isToday(day) && !isEqual(day, selectedDay) && "border border-pink-600 text-pink-600"
                  )}
                >
                  {format(day, "d")}
                </time>
                {data.filter((date) => isSameDay(date.day, day)).length > 0 && (
                  <div>
                    {data
                      .filter((date) => isSameDay(date.day, day))
                      .map((date) => (
                        <div
                          key={date.day.toString()}
                          className="-mx-0.5 mt-auto flex flex-wrap-reverse"
                        >
                          {date.events.map((event) => (
                            <span
                              key={event.id}
                              className={cn(
                                "mx-0.5 mt-1 h-1.5 w-1.5 rounded-full",
                                event.type ? eventTypeColors[event.type] : eventTypeColors.default
                              )}
                            />
                          ))}
                        </div>
                      ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Add Event Dialog */}
      <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Event for {format(selectedDay, "MMMM d, yyyy")}</DialogTitle>
            <DialogDescription>
              Create a new event, task, or reminder for your calendar.
            </DialogDescription>
          </DialogHeader>
          <AddEventForm 
            date={selectedDay} 
            onClose={() => setIsAddEventOpen(false)}
            onAddTask={onAddTask}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

export type { CalendarData, Event } 