"use client"

import { format } from "date-fns"
import {
  Calendar,
  Clock,
  Repeat,
  CheckCircle2,
  Users,
  MessageCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ActivityWithParticipants, CalendarActivity } from "@/types/database"
import { getRecurrenceDescription } from "@/lib/recurrence"

type ActivityData = CalendarActivity | ActivityWithParticipants

interface ActivityListItemProps {
  activity: ActivityData
  isSelected: boolean
  onClick: () => void
}

// Helper functions
function getIsRecurring(activity: ActivityData): boolean {
  if ('isRecurring' in activity) return !!activity.isRecurring
  if ('is_recurring' in activity) return !!activity.is_recurring
  return false
}

function getIsInstance(activity: ActivityData): boolean {
  if ('isInstance' in activity) return !!activity.isInstance
  return false
}

function getOccurrenceAt(activity: ActivityData): Date | undefined {
  if ('occurrenceAt' in activity && activity.occurrenceAt) {
    return activity.occurrenceAt instanceof Date 
      ? activity.occurrenceAt 
      : new Date(activity.occurrenceAt)
  }
  return undefined
}

function getStartAt(activity: ActivityData): string | Date | null {
  if ('startAt' in activity) return activity.startAt || null
  if ('start_at' in activity) return activity.start_at
  return null
}

function getDueAt(activity: ActivityData): string | Date | null {
  if ('dueAt' in activity) return activity.dueAt || null
  if ('due_at' in activity) return activity.due_at
  return null
}

function getRecurrenceRule(activity: ActivityData): string | null {
  if ('recurrenceRule' in activity) return activity.recurrenceRule || null
  if ('recurrence_rule' in activity) return activity.recurrence_rule
  return null
}

const priorityConfig: Record<string, { color: string; bgColor: string }> = {
  LOW: { color: "text-slate-600", bgColor: "bg-slate-100 dark:bg-slate-800" },
  MEDIUM: { color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900" },
  HIGH: { color: "text-orange-600", bgColor: "bg-orange-100 dark:bg-orange-900" },
  URGENT: { color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900" },
}

const statusConfig: Record<string, { label: string; color: string }> = {
  TODO: { label: "To Do", color: "bg-slate-500" },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-500" },
  DONE: { label: "Done", color: "bg-green-500" },
  CANCELLED: { label: "Cancelled", color: "bg-red-500" },
}

export function ActivityListItem({ activity, isSelected, onClick }: ActivityListItemProps) {
  const isRecurring = getIsRecurring(activity)
  const isInstance = getIsInstance(activity)
  const occurrenceAt = getOccurrenceAt(activity)
  const startAt = getStartAt(activity)
  const dueAt = getDueAt(activity)
  const recurrenceRule = getRecurrenceRule(activity)

  const categoryColor = activity.category?.color || '#64748b'
  const displayDate = occurrenceAt || (startAt ? new Date(startAt) : null) || (dueAt ? new Date(dueAt) : null)
  const priority = priorityConfig[activity.priority || "MEDIUM"]
  const status = statusConfig[activity.status || "TODO"]
  const participants = activity.participants || []
  const isDone = activity.status === "DONE"
  const recurrenceText = recurrenceRule ? getRecurrenceDescription(recurrenceRule) : null

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative p-4 cursor-pointer transition-all rounded-lg border bg-card",
        "hover:bg-accent/50 hover:shadow-sm",
        isSelected && "ring-2 ring-primary bg-primary/5",
        isDone && "opacity-60"
      )}
    >
      {/* Category indicator */}
      <div 
        className="absolute left-0 top-3 bottom-3 w-1 rounded-full"
        style={{ backgroundColor: categoryColor }}
      />

      <div className="flex gap-3 pl-2">
        {/* Status indicator dot */}
        <div className="flex-shrink-0 pt-1">
          <div 
            className={cn("h-2.5 w-2.5 rounded-full", status.color)}
            title={status.label}
          />
        </div>

        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2">
            <h3 className={cn(
              "font-medium text-sm leading-tight",
              isDone && "line-through text-muted-foreground"
            )}>
              {activity.title}
            </h3>
            {isRecurring && (
              <Badge variant="secondary" className="shrink-0 h-5 px-1.5 text-[10px]">
                <Repeat className="h-3 w-3 mr-0.5" />
                {isInstance ? "Instance" : ""}
              </Badge>
            )}
          </div>

          {/* Category & Type */}
          <div className="flex items-center gap-2 mt-1">
            {activity.category && (
              <span 
                className="text-xs font-medium"
                style={{ color: categoryColor }}
              >
                {activity.category.name}
              </span>
            )}
            <Badge 
              variant="outline" 
              className={cn(
                "text-[10px] px-1.5 py-0 h-4",
                activity.type === "TASK" ? "border-blue-300 text-blue-600" : "border-purple-300 text-purple-600"
              )}
            >
              {activity.type}
            </Badge>
          </div>

          {/* Description preview */}
          {activity.description && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
              {activity.description}
            </p>
          )}

          {/* Meta info */}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            {displayDate && (
              <span className="flex items-center gap-1">
                {activity.type === "TASK" ? (
                  <Clock className="h-3 w-3" />
                ) : (
                  <Calendar className="h-3 w-3" />
                )}
                {format(displayDate, "EEE, d MMM yyyy • h:mm a")}
              </span>
            )}
            {recurrenceText && !isInstance && (
              <span className="capitalize text-primary/70">
                {recurrenceText}
              </span>
            )}
          </div>

          {/* Bottom row: Priority & Participants */}
          <div className="flex items-center justify-between mt-2">
            <Badge 
              variant="secondary" 
              className={cn("text-[10px] px-1.5 py-0 h-4", priority.bgColor, priority.color)}
            >
              {activity.priority}
            </Badge>
            
            {participants.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                {participants.length}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
