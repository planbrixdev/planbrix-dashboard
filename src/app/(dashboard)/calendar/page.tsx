"use client"

import { useState, useMemo } from "react"
import { addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from "date-fns"
import { CalendarHeader } from "@/components/calendar/CalendarHeader"
import { MonthView } from "@/components/calendar/MonthView"
import { WeekView } from "@/components/calendar/WeekView"
import { DayView } from "@/components/calendar/DayView"
import { EventDetailDialog } from "@/components/calendar/EventDetailDialog"
import { TaskForm } from "@/components/tasks/TaskForm"
import { useEventDetail } from "@/hooks/use-event-detail"
import { CalendarView as ViewType } from "@/types"
import type { Task, Category } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

// Mock categories for filtering
const MOCK_CATEGORIES: Category[] = [
  { id: "c1", name: "Work", color: "#7C6AFA", created_at: "", user_id: "", icon: null },
  { id: "c2", name: "Personal", color: "#F59E0B", created_at: "", user_id: "", icon: null },
  { id: "c3", name: "Health", color: "#10B981", created_at: "", user_id: "", icon: null },
]

// Temporary mock data sharing to visualize
const MOCK_TASKS: Task[] = [
  {
    id: "1",
    user_id: "u1",
    title: "Quarterly Review",
    description: "Review Q4 performance metrics and set goals for Q1",
    due_date: new Date().toISOString(),
    due_time: "09:00",
    status: "pending",
    priority: "high",
    category: MOCK_CATEGORIES[0],
    is_recurring: false,
    created_at: "", updated_at: "", start_date: null, start_time: null, all_day: false, recurrence_rule: null, parent_task_id: null, completed_at: null, deleted_at: null
  },
  {
    id: "2",
    user_id: "u1",
    title: "Team Lunch",
    description: "Lunch meeting with the marketing team",
    due_date: new Date().toISOString(),
    due_time: "12:30",
    status: "pending",
    priority: "medium",
    category: MOCK_CATEGORIES[1],
    is_recurring: false,
    created_at: "", updated_at: "", start_date: null, start_time: null, all_day: false, recurrence_rule: null, parent_task_id: null, completed_at: null, deleted_at: null
  },
  {
    id: "3",
    user_id: "u1",
    title: "Doctor Appointment",
    description: "Annual health checkup",
    due_date: new Date(Date.now() + 86400000 * 2).toISOString(),
    due_time: "15:00",
    status: "pending",
    priority: "high",
    category: MOCK_CATEGORIES[2],
    is_recurring: false,
    created_at: "", updated_at: "", start_date: null, start_time: null, all_day: false, recurrence_rule: null, parent_task_id: null, completed_at: null, deleted_at: null
  },
]

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<ViewType>("month")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [isNewEventOpen, setIsNewEventOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const eventDetail = useEventDetail()

  const handlePrev = () => {
    if (view === "month") setCurrentDate(subMonths(currentDate, 1))
    if (view === "week") setCurrentDate(subWeeks(currentDate, 1))
    if (view === "day") setCurrentDate(subDays(currentDate, 1))
  }

  const handleNext = () => {
    if (view === "month") setCurrentDate(addMonths(currentDate, 1))
    if (view === "week") setCurrentDate(addWeeks(currentDate, 1))
    if (view === "day") setCurrentDate(addDays(currentDate, 1))
  }

  const handleToday = () => setCurrentDate(new Date())

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setIsNewEventOpen(true)
  }

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const filteredTasks = useMemo(() => {
    if (selectedCategories.length === 0) return MOCK_TASKS
    return MOCK_TASKS.filter(task =>
      task.category && selectedCategories.includes(task.category.id)
    )
  }, [selectedCategories])

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] md:h-[calc(100vh-8rem)] min-h-0">
      <CalendarHeader
        currentDate={currentDate}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        view={view}
        onViewChange={setView}
      />

      {/* Category Filter Bar */}
      <div className="flex items-center gap-2 mb-2 px-1 overflow-x-auto pb-1">
        <span className="text-xs text-muted-foreground shrink-0">Filter:</span>
        {MOCK_CATEGORIES.map(cat => (
          <Badge
            key={cat.id}
            variant={selectedCategories.includes(cat.id) ? "default" : "outline"}
            className="cursor-pointer shrink-0 transition-all"
            style={selectedCategories.includes(cat.id) ? {
              backgroundColor: cat.color,
              borderColor: cat.color,
              color: 'white'
            } : {
              borderColor: `${cat.color}60`,
              color: cat.color
            }}
            onClick={() => toggleCategory(cat.id)}
          >
            {cat.name}
          </Badge>
        ))}
        {selectedCategories.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => setSelectedCategories([])}
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-hidden p-1">
        {view === "month" && (
          <MonthView
            currentDate={currentDate}
            tasks={filteredTasks}
            onEventClick={eventDetail.onOpen}
            onDateClick={handleDateClick}
          />
        )}
        {view === "week" && (
          <WeekView
            currentDate={currentDate}
            tasks={filteredTasks}
            onEventClick={eventDetail.onOpen}
          />
        )}
        {view === "day" && (
          <DayView
            currentDate={currentDate}
            tasks={filteredTasks}
            onEventClick={eventDetail.onOpen}
          />
        )}
      </div>

      {/* Event Detail Dialog */}
      <EventDetailDialog />

      {/* New Event Dialog */}
      <TaskForm
        open={isNewEventOpen}
        onOpenChange={setIsNewEventOpen}
        initialDate={selectedDate}
      />
    </div>
  )
}
