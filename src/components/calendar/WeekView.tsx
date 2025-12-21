"use client"

import { format, startOfWeek, eachDayOfInterval, addDays, isSameDay, isToday, getHours, getMinutes, differenceInMinutes } from "date-fns"
import { cn } from "@/lib/utils"
import { CalendarActivity, ActivityWithParticipants } from "@/types/database"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Repeat } from "lucide-react"

interface WeekViewProps {
   currentDate: Date
   activities: (CalendarActivity | ActivityWithParticipants)[]
   onEventClick?: (activity: CalendarActivity | ActivityWithParticipants) => void
   onDateClick?: (date: Date) => void
}

const HOUR_HEIGHT = 60 // Height per hour in pixels

// Helper function to get activity start date
function getActivityStartDate(activity: CalendarActivity | ActivityWithParticipants): Date | null {
  if ('startAt' in activity && activity.startAt) {
    return activity.startAt instanceof Date ? activity.startAt : new Date(activity.startAt)
  }
  if ('dueAt' in activity && activity.dueAt) {
    return activity.dueAt instanceof Date ? activity.dueAt : new Date(activity.dueAt)
  }
  if ('occurrenceAt' in activity && activity.occurrenceAt) {
    return activity.occurrenceAt instanceof Date ? activity.occurrenceAt : new Date(activity.occurrenceAt)
  }
  if ('start_at' in activity && activity.start_at) {
    return new Date(activity.start_at)
  }
  if ('due_at' in activity && activity.due_at) {
    return new Date(activity.due_at)
  }
  return null
}

// Helper function to get activity end date
function getActivityEndDate(activity: CalendarActivity | ActivityWithParticipants): Date | null {
  if ('endAt' in activity && activity.endAt) {
    return activity.endAt instanceof Date ? activity.endAt : new Date(activity.endAt)
  }
  if ('end_at' in activity && activity.end_at) {
    return new Date(activity.end_at)
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

export function WeekView({ currentDate, activities, onEventClick, onDateClick }: WeekViewProps) {
   const weekStart = startOfWeek(currentDate)
   const weekDays = eachDayOfInterval({
      start: weekStart,
      end: addDays(weekStart, 6),
   })

   const hours = Array.from({ length: 24 }, (_, i) => i)

   const getEventStyle = (activity: CalendarActivity | ActivityWithParticipants) => {
      const start = getActivityStartDate(activity) || new Date()
      const end = getActivityEndDate(activity) || new Date(start.getTime() + 60 * 60 * 1000) // Default 1 hour duration

      const startHour = getHours(start)
      const startMinute = getMinutes(start)
      const durationMinutes = differenceInMinutes(end, start)

      const top = (startHour * HOUR_HEIGHT) + ((startMinute / 60) * HOUR_HEIGHT)
      const height = Math.max((durationMinutes / 60) * HOUR_HEIGHT, 30) // Min height 30px

      const activityType = getActivityType(activity)
      
      return {
         top: `${top}px`,
         height: `${height}px`,
         backgroundColor: activityType === 'EVENT' ? '#e0f2fe' : '#f1f5f9',
         borderColor: activityType === 'EVENT' ? '#7dd3fc' : '#cbd5e1',
         color: activityType === 'EVENT' ? '#0369a1' : '#334155'
      }
   }

   return (
      <div className="flex flex-col h-full bg-card/40 rounded-xl border shadow-sm backdrop-blur-sm overflow-hidden">
         {/* Header Row */}
         <div className="flex border-b bg-muted/30 shrink-0">
            {/* Time gutter header - spacer */}
            <div className="w-14 shrink-0 border-r bg-muted/10"></div>
            {/* Day Headers */}
            {weekDays.map((day, idx) => (
               <div
                  key={day.toString()}
                  className={cn(
                     "flex-1 py-2 text-center cursor-pointer hover:bg-muted/20 transition-colors",
                     idx < 6 && "border-r"
                  )}
                  onClick={() => onDateClick?.(day)}
               >
                  <div className="text-xs font-medium text-muted-foreground uppercase">{format(day, "EEE")}</div>
                  <div className={cn(
                     "mt-1 text-lg font-bold h-8 w-8 mx-auto flex items-center justify-center rounded-full",
                     isToday(day) && "bg-primary text-primary-foreground"
                  )}>
                     {format(day, "d")}
                  </div>
               </div>
            ))}
         </div>

         {/* Time Grid */}
         <ScrollArea className="flex-1">
            <div className="flex relative" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
               {/* Time Labels */}
               <div className="w-14 shrink-0 border-r bg-muted/5 divide-y text-xs text-muted-foreground font-medium text-right pr-2">
                  {hours.map((hour) => (
                     <div key={hour} className="relative" style={{ height: `${HOUR_HEIGHT}px` }}>
                        <span className="absolute -top-2.5 right-0">{format(new Date().setHours(hour, 0, 0, 0), "ha")}</span>
                     </div>
                  ))}
               </div>

               {/* Days Columns */}
               <div className="flex-1 flex relative">
                  {/* Horizontal Grid Lines */}
                  <div className="absolute inset-0 flex flex-col pointer-events-none z-0">
                     {hours.map((hour) => (
                        <div key={hour} className="border-b border-dashed border-muted/30 w-full" style={{ height: `${HOUR_HEIGHT}px` }} />
                     ))}
                  </div>

                  {weekDays.map((day, idx) => {
                     const dayActivities = activities.filter(a => {
                        const date = getActivityStartDate(a)
                        return date && isSameDay(date, day)
                     })

                     return (
                        <div
                           key={day.toString()}
                           className={cn(
                              "flex-1 relative border-r last:border-r-0 h-full",
                              isToday(day) && "bg-primary/5"
                           )}
                           onClick={() => onDateClick?.(day)}
                        >
                           {dayActivities.map(activity => {
                              const recurring = isRecurring(activity)
                              const startDate = getActivityStartDate(activity)
                              
                              return (
                                 <div
                                    key={activity.id}
                                    className="absolute left-0.5 right-0.5 rounded border px-2 py-1 text-xs overflow-hidden cursor-pointer hover:opacity-80 hover:scale-[1.02] transition-all z-10 shadow-sm"
                                    style={getEventStyle(activity)}
                                    onClick={(e) => {
                                       e.stopPropagation()
                                       onEventClick?.(activity)
                                    }}
                                 >
                                    <div className="font-semibold truncate flex items-center gap-1">
                                       {recurring && <Repeat className="h-3 w-3 shrink-0" />}
                                       <span className="truncate">{activity.title}</span>
                                    </div>
                                    <div className="text-[10px] opacity-80 truncate">
                                       {startDate && format(startDate, "h:mm a")}
                                    </div>
                                 </div>
                              )
                           })}
                        </div>
                     )
                  })}
               </div>
            </div>
         </ScrollArea>
      </div>
   )
}
