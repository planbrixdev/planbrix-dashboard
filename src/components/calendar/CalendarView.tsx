"use client"

import { useState } from "react"
import { addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, format, startOfWeek, endOfWeek } from "date-fns"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MonthView } from "./MonthView"
import { WeekView } from "./WeekView"
import { DayView } from "./DayView"
import { ActivityWithParticipants } from "@/types/database"
import { CreateActivityButton } from "@/components/activities/CreateActivityButton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface CalendarViewProps {
  activities: ActivityWithParticipants[]
}

type ViewType = "month" | "week" | "day"

export function CalendarView({ activities }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<ViewType>("month")

  const next = () => {
    if (view === "month") setCurrentDate(addMonths(currentDate, 1))
    else if (view === "week") setCurrentDate(addWeeks(currentDate, 1))
    else setCurrentDate(addDays(currentDate, 1))
  }

  const prev = () => {
    if (view === "month") setCurrentDate(subMonths(currentDate, 1))
    else if (view === "week") setCurrentDate(subWeeks(currentDate, 1))
    else setCurrentDate(subDays(currentDate, 1))
  }

  const goToToday = () => setCurrentDate(new Date())

  const getHeaderLabel = () => {
    if (view === "month") return format(currentDate, "MMMM yyyy")
    if (view === "week") {
      const start = startOfWeek(currentDate)
      const end = endOfWeek(currentDate)
      if (start.getMonth() === end.getMonth()) {
        return `${format(start, "MMMM yyyy")}`
      }
      return `${format(start, "MMM")} - ${format(end, "MMM yyyy")}`
    }
    return format(currentDate, "MMMM d, yyyy")
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight min-w-[200px]">
              {getHeaderLabel()}
            </h2>
            <div className="flex items-center rounded-md border bg-background shadow-sm">
              <Button variant="ghost" size="icon" onClick={prev} className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={goToToday} className="h-8 px-3 font-normal border-x rounded-none">
                Today
              </Button>
              <Button variant="ghost" size="icon" onClick={next} className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <Select value={view} onValueChange={(v) => setView(v as ViewType)}>
            <SelectTrigger className="w-[120px] h-8">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="day">Day</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <CreateActivityButton />
      </div>

      <div className="flex-1 min-h-0">
        {view === "month" && (
          <MonthView 
            currentDate={currentDate} 
            activities={activities}
            onEventClick={(activity) => console.log("Clicked", activity)}
            onDateClick={(date) => {
              setCurrentDate(date)
              setView("day")
            }}
          />
        )}
        {view === "week" && (
          <WeekView 
            currentDate={currentDate} 
            activities={activities}
            onEventClick={(activity) => console.log("Clicked", activity)}
            onDateClick={(date) => {
              setCurrentDate(date)
              setView("day")
            }}
          />
        )}
        {view === "day" && (
          <DayView 
            currentDate={currentDate} 
            activities={activities}
            onEventClick={(activity) => console.log("Clicked", activity)}
          />
        )}
      </div>
    </div>
  )
}
