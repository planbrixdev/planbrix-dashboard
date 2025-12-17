"use client"

import { format, startOfWeek, eachDayOfInterval, addDays, isSameDay, isToday } from "date-fns"
import { cn } from "@/lib/utils"
import { Task } from "@/types"
import { useTaskModal } from "@/hooks/use-task-modal"
import { ScrollArea } from "@/components/ui/scroll-area"

interface WeekViewProps {
   currentDate: Date
   tasks: Task[]
   onEventClick?: (task: Task) => void
}

const HOUR_HEIGHT = 48 // Height per hour in pixels

export function WeekView({ currentDate, tasks, onEventClick }: WeekViewProps) {
   const { onOpen } = useTaskModal()
   const weekStart = startOfWeek(currentDate)
   const weekDays = eachDayOfInterval({
      start: weekStart,
      end: addDays(weekStart, 6),
   })

   const hours = Array.from({ length: 24 }, (_, i) => i)

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
                     "flex-1 py-2 text-center",
                     idx < 6 && "border-r"
                  )}
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

         {/* Time Grid - Scrollable */}
         <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex pt-4" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
               {/* Time Gutter */}
               <div className="w-14 shrink-0 border-r bg-muted/5 text-xs text-muted-foreground font-medium">
                  {hours.map((hour) => (
                     <div
                        key={hour}
                        className="relative border-b border-dashed border-muted/30"
                        style={{ height: `${HOUR_HEIGHT}px` }}
                     >
                        <span className="absolute -top-2.5 right-1.5 bg-background/80 px-1 rounded text-[11px]">
                           {format(new Date().setHours(hour, 0, 0, 0), "ha")}
                        </span>
                     </div>
                  ))}
               </div>

               {/* Day Columns */}
               {weekDays.map((day, idx) => (
                  <div
                     key={day.toString()}
                     className={cn(
                        "flex-1 relative",
                        idx < 6 && "border-r"
                     )}
                     style={{ height: `${24 * HOUR_HEIGHT}px` }}
                  >
                     {/* Interactive Hour Slots */}
                     {hours.map((hour) => (
                        <div
                           key={`slot-${hour}`}
                           className="absolute w-full border-t border-dashed border-muted/30 hover:bg-primary/5 cursor-pointer transition-colors"
                           style={{
                              top: `${hour * HOUR_HEIGHT}px`,
                              height: `${HOUR_HEIGHT}px`
                           }}
                           onClick={(e) => {
                              // Prevent click from bubbling if clicking on an event (though event has z-index)
                              if (e.target === e.currentTarget) {
                                 const timeString = `${hour.toString().padStart(2, '0')}:00`
                                 onOpen({ date: day, startTime: timeString })
                              }
                           }}
                        />
                     ))}

                     {/* Render events for this day */}
                     {tasks.filter(t => t.due_date && isSameDay(new Date(t.due_date), day)).map(task => {
                        const timeParts = (task.due_time || "00:00").split(":")
                        const h = parseInt(timeParts[0]) || 0
                        const m = parseInt(timeParts[1]) || 0
                        const top = (h * HOUR_HEIGHT) + ((m / 60) * HOUR_HEIGHT)

                        return (
                           <div
                              key={task.id}
                              onClick={() => onEventClick?.(task)}
                              className="absolute left-0.5 right-0.5 p-1.5 rounded-md border text-xs overflow-hidden shadow-sm hover:z-10 transition-all hover:scale-[1.02] cursor-pointer"
                              style={{
                                 top: `${top}px`,
                                 height: `${HOUR_HEIGHT - 4}px`,
                                 backgroundColor: `${task.category?.color || '#3b82f6'}20`,
                                 color: task.category?.color || '#3b82f6',
                                 borderLeftWidth: '3px',
                                 borderLeftColor: task.category?.color || '#3b82f6'
                              }}
                           >
                              <div className="font-semibold truncate text-[11px]">{task.title}</div>
                              <div className="opacity-80 truncate text-[10px]">{task.due_time}</div>
                           </div>
                        )
                     })}
                  </div>
               ))}
            </div>
         </div>
      </div>
   )
}
