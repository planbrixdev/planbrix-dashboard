"use client"

import { useState } from "react"
import { MoreHorizontal, Calendar, Clock, CheckCircle2, Circle } from "lucide-react"


import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { cn, getPriorityColor, formatRelativeDate } from "@/lib/utils"
import type { Task } from "@/types"

interface TaskCardProps {
  task: Task
  onComplete?: (id: string) => void
  onDelete?: (id: string) => void
  onEdit?: (task: Task) => void
}

export function TaskCard({ task, onComplete, onDelete, onEdit }: TaskCardProps) {
  const [status, setStatus] = useState(task.status)
  const priorityColor = getPriorityColor(task.priority)
  const isCompleted = status === "completed"
  const isInProgress = status === "in-progress"

  const handleStatusToggle = () => {
    // Cycle through: pending -> in-progress -> completed -> pending
    const nextStatus = status === "pending"
      ? "in-progress"
      : status === "in-progress"
        ? "completed"
        : "pending"
    setStatus(nextStatus)
    onComplete?.(task.id)
  }

  // Status-based styling
  const statusStyles = {
    "pending": {
      border: "border-l-4 border-l-blue-500",
      iconBorder: "border-muted-foreground hover:border-blue-500",
      iconBg: "",
    },
    "in-progress": {
      border: "border-l-4 border-l-amber-500 shadow-amber-500/10 shadow-md",
      iconBorder: "border-amber-500 bg-amber-500/20",
      iconBg: "text-amber-500",
    },
    "completed": {
      border: "border-l-4 border-l-green-500",
      iconBorder: "border-green-500 bg-green-500 text-white",
      iconBg: "",
    },
  }

  const currentStyle = statusStyles[status]

  return (
    <div
      className={cn(
        "group flex items-start justify-between rounded-xl border p-4 transition-all hover:bg-muted/50 hover:shadow-sm bg-card/60 glass",
        isCompleted && "opacity-60 bg-muted/20",
        currentStyle.border
      )}
    >
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "mt-0.5 h-6 w-6 rounded-full border-2 p-0 hover:bg-transparent transition-all",
            currentStyle.iconBorder,
            currentStyle.iconBg
          )}
          onClick={handleStatusToggle}
          title={`Current: ${status}. Click to change status.`}
        >
          {isCompleted ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : isInProgress ? (
            <Clock className="h-4 w-4 animate-pulse" />
          ) : (
            <Circle className="h-4 w-4 fill-transparent" />
          )}
          <span className="sr-only">Toggle status</span>
        </Button>

        <div className="space-y-1">
          <h4
            className={cn(
              "font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              isCompleted && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </h4>

          {task.description && (
            <p className={cn("text-sm text-muted-foreground line-clamp-2", isCompleted && "line-through")}>
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-muted-foreground">
            {/* Status Badge */}
            <Badge
              variant="secondary"
              className={cn(
                "h-5 px-1.5 text-[10px] capitalize",
                status === "pending" && "bg-blue-500/20 text-blue-600",
                status === "in-progress" && "bg-amber-500/20 text-amber-600",
                status === "completed" && "bg-green-500/20 text-green-600"
              )}
            >
              {status}
            </Badge>

            {task.due_date && (
              <div className={cn("flex items-center gap-1",
                new Date(task.due_date) < new Date() && !isCompleted ? "text-red-500 font-medium" : ""
              )}>
                <Calendar className="h-3 w-3" />
                <span>{formatRelativeDate(new Date(task.due_date))}</span>
              </div>
            )}

            {(task.start_time || task.due_time) && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>
                  {task.start_time && task.due_time
                    ? `${task.start_time} - ${task.due_time}`
                    : task.start_time || task.due_time
                  }
                </span>
              </div>
            )}

            {task.category && (
              <Badge variant="outline" className="h-5 gap-1 border-0" style={{ backgroundColor: `${task.category.color}15`, color: task.category.color }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: task.category.color }} />
                {task.category.name}
              </Badge>
            )}

            <Badge variant="secondary" className={cn("h-5 px-1.5 text-[10px] capitalize", priorityColor.bg, priorityColor.text)}>
              {task.priority}
            </Badge>
          </div>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit?.(task)}>Edit</DropdownMenuItem>
          <DropdownMenuItem>Set Reminder</DropdownMenuItem>
          <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-100 dark:focus:bg-red-900/40" onClick={() => onDelete?.(task.id)}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
