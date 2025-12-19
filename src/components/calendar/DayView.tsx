"use client"

import { format, isToday, getHours, getMinutes, differenceInMinutes, isSameDay } from "date-fns"
import { cn } from "@/lib/utils"
import { ActivityWithParticipants } from "@/types/database"
import { ScrollArea } from "@/components/ui/scroll-area"

interface DayViewProps {
    currentDate: Date
    activities: ActivityWithParticipants[]
    onEventClick?: (activity: ActivityWithParticipants) => void
}

const HOUR_HEIGHT = 80 // Height per hour in pixels

export function DayView({ currentDate, activities, onEventClick }: DayViewProps) {
    const hours = Array.from({ length: 24 }, (_, i) => i)

    const dayActivities = activities.filter(a => {
        const date = a.start_at ? new Date(a.start_at) : a.due_at ? new Date(a.due_at) : null
        return date && isSameDay(date, currentDate)
    })

    const getEventStyle = (activity: ActivityWithParticipants) => {
        const start = activity.start_at ? new Date(activity.start_at) : activity.due_at ? new Date(activity.due_at) : new Date()
        const end = activity.end_at ? new Date(activity.end_at) : new Date(start.getTime() + 60 * 60 * 1000) // Default 1 hour duration

        const startHour = getHours(start)
        const startMinute = getMinutes(start)
        const durationMinutes = differenceInMinutes(end, start)

        const top = (startHour * HOUR_HEIGHT) + ((startMinute / 60) * HOUR_HEIGHT)
        const height = Math.max((durationMinutes / 60) * HOUR_HEIGHT, 40) // Min height 40px

        return {
            top: `${top}px`,
            height: `${height}px`,
            backgroundColor: activity.type === 'EVENT' ? '#e0f2fe' : '#f1f5f9',
            borderColor: activity.type === 'EVENT' ? '#7dd3fc' : '#cbd5e1',
            color: activity.type === 'EVENT' ? '#0369a1' : '#334155'
        }
    }

    return (
        <div className="flex flex-col h-full bg-card/40 rounded-xl border shadow-sm backdrop-blur-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-center py-4 border-b bg-muted/30 shrink-0">
                <div className="text-center">
                    <div className="text-sm font-medium text-muted-foreground uppercase">{format(currentDate, "EEEE")}</div>
                    <div className={cn(
                        "mt-1 text-3xl font-bold h-12 w-12 mx-auto flex items-center justify-center rounded-full",
                        isToday(currentDate) && "bg-primary text-primary-foreground"
                    )}>
                        {format(currentDate, "d")}
                    </div>
                </div>
            </div>

            {/* Time Grid */}
            <ScrollArea className="flex-1">
                <div className="flex relative" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
                    <div className="w-20 shrink-0 border-r bg-muted/5 divide-y text-xs text-muted-foreground font-medium text-right pr-4">
                        {hours.map((hour) => (
                            <div key={hour} className="relative" style={{ height: `${HOUR_HEIGHT}px` }}>
                                <span className="absolute -top-2.5 right-0">{format(new Date().setHours(hour, 0, 0, 0), "ha")}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex-1 relative bg-background/30">
                        {/* Horizontal Grid Lines */}
                        <div className="absolute inset-0 flex flex-col pointer-events-none z-0">
                            {hours.map((hour) => (
                                <div key={hour} className="border-b border-dashed border-muted/30 w-full" style={{ height: `${HOUR_HEIGHT}px` }} />
                            ))}
                        </div>

                        {/* Activities */}
                        {dayActivities.map(activity => (
                            <div
                                key={activity.id}
                                className="absolute left-2 right-2 rounded border px-4 py-2 overflow-hidden cursor-pointer hover:opacity-80 hover:scale-[1.01] transition-all z-10 shadow-sm"
                                style={getEventStyle(activity)}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onEventClick?.(activity)
                                }}
                            >
                                <div className="font-semibold">{activity.title}</div>
                                <div className="text-sm opacity-80">
                                    {activity.start_at && format(new Date(activity.start_at), "h:mm a")}
                                    {activity.due_at && `Due: ${format(new Date(activity.due_at), "h:mm a")}`}
                                </div>
                                {activity.description && (
                                    <div className="text-xs mt-1 opacity-70 line-clamp-2">{activity.description}</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </ScrollArea>
        </div>
    )
}
