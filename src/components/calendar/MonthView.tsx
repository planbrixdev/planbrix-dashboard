"use client"

import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, startOfMonth, endOfMonth } from "date-fns"
import { cn } from "@/lib/utils"
import { CalendarActivity, ActivityWithParticipants } from "@/types/database"
import { Repeat } from "lucide-react"

interface MonthViewProps {
  currentDate: Date
  activities: (CalendarActivity | ActivityWithParticipants)[]
  onEventClick?: (activity: CalendarActivity | ActivityWithParticipants) => void
  onDateClick?: (date: Date) => void
}

// Helper function to get activity date
function getActivityDate(activity: CalendarActivity | ActivityWithParticipants): Date | null {
  // Handle CalendarActivity format
  if ('startAt' in activity && activity.startAt) {
    return activity.startAt instanceof Date ? activity.startAt : new Date(activity.startAt)
  }
  if ('dueAt' in activity && activity.dueAt) {
    return activity.dueAt instanceof Date ? activity.dueAt : new Date(activity.dueAt)
  }
  if ('occurrenceAt' in activity && activity.occurrenceAt) {
    return activity.occurrenceAt instanceof Date ? activity.occurrenceAt : new Date(activity.occurrenceAt)
  }
  
  // Handle ActivityWithParticipants format
  if ('start_at' in activity && activity.start_at) {
    return new Date(activity.start_at)
  }
  if ('due_at' in activity && activity.due_at) {
    return new Date(activity.due_at)
  }
  
  return null
}

// Helper function to check if activity is recurring
function isRecurring(activity: CalendarActivity | ActivityWithParticipants): boolean {
  return ('isRecurring' in activity && activity.isRecurring) || 
         ('is_recurring' in activity && activity.is_recurring) || false
}

// Helper function to get activity type
function getActivityType(activity: CalendarActivity | ActivityWithParticipants): string {
  return activity.type || 'TASK'
}

export function MonthView({ currentDate, activities, onEventClick, onDateClick }: MonthViewProps) {
  const monthStart = startOfWeek(startOfMonth(currentDate))
  const monthEnd = endOfWeek(endOfMonth(currentDate))

  const calendarDays = eachDayOfInterval({
    start: monthStart,
    end: monthEnd,
  })

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <div className="flex flex-col h-full bg-card/40 rounded-xl border shadow-sm overflow-hidden backdrop-blur-sm">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b bg-muted/30">
        {weekDays.map((day) => (
          <div key={day} className="py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid - Full Height */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr">
        {calendarDays.map((day, dayIdx) => {
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isDayToday = isToday(day)
          const dayActivities = activities.filter(a => {
            const date = getActivityDate(a)
            return date && isSameDay(date, day)
          })
          const isLastRow = dayIdx >= calendarDays.length - 7

          return (
            <div
              key={day.toString()}
              className={cn(
                "border-r p-1 md:p-2 transition-colors relative group hover:bg-muted/20 cursor-pointer",
                !isCurrentMonth && "bg-muted/5 text-muted-foreground/50",
                dayIdx % 7 === 6 && "border-r-0",
                !isLastRow && "border-b"
              )}
              onClick={() => onDateClick?.(day)}
            >
              <div className="flex items-center justify-between pointer-events-none">
                <span
                  className={cn(
                    "text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full pointer-events-auto cursor-pointer hover:bg-primary/20 transition-colors",
                    isDayToday && "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>

              {/* Tasks/Events List */}
              <div className="mt-1 space-y-0.5 md:space-y-1 overflow-hidden max-h-[40px] md:max-h-[80px]">
                {dayActivities.slice(0, 3).map((activity) => {
                  const activityType = getActivityType(activity)
                  const recurring = isRecurring(activity)
                  
                  return (
                    <div
                      key={activity.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEventClick?.(activity)
                      }}
                      className="text-[10px] px-1.5 py-0.5 rounded truncate border cursor-pointer hover:opacity-80 hover:scale-[1.02] transition-all flex items-center gap-1"
                      style={{
                        backgroundColor: activityType === 'EVENT' ? '#e0f2fe' : '#f1f5f9',
                        borderColor: activityType === 'EVENT' ? '#7dd3fc' : '#cbd5e1',
                        color: activityType === 'EVENT' ? '#0369a1' : '#334155'
                      }}
                    >
                      {recurring && <Repeat className="h-2.5 w-2.5 shrink-0" />}
                      <span className="truncate">{activity.title}</span>
                    </div>
                  )
                })}
                {dayActivities.length > 3 && (
                  <div className="text-[10px] text-muted-foreground pl-1">
                    +{dayActivities.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
