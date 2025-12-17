"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn, getPriorityColor } from "@/lib/utils"
import type { Task } from "@/types"
import { Clock, CheckCircle2, Circle } from "lucide-react"
import { useEventDetail } from "@/hooks/use-event-detail"

// Mock data - replace with real data later
const MOCK_TASKS: Partial<Task>[] = [
  {
    id: "1",
    title: "Morning Standup Team A",
    due_time: "09:00",
    priority: "high",
    category: { id: "c1", name: "Work", color: "#7C6AFA", created_at: "", user_id: "", icon: null },
    status: "pending"
  },
  {
    id: "2",
    title: "Review PR #123",
    due_time: "10:30",
    priority: "medium",
    category: { id: "c1", name: "Work", color: "#7C6AFA", created_at: "", user_id: "", icon: null },
    status: "pending"
  },
  {
    id: "3",
    title: "Lunch with Client",
    due_time: "12:00",
    priority: "low",
    category: { id: "c2", name: "Personal", color: "#F59E0B", created_at: "", user_id: "", icon: null },
    status: "pending"
  },
  {
    id: "4",
    title: "Update Documentation",
    due_time: "14:00",
    priority: "medium",
    category: { id: "c1", name: "Work", color: "#7C6AFA", created_at: "", user_id: "", icon: null },
    status: "completed"
  },
]

export function TodayTasks() {
  const { onOpen } = useEventDetail()

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-3 glass">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Today&apos;s Tasks</span>
          <span className="text-sm font-normal text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {MOCK_TASKS.map((task) => {
            const priorityColor = getPriorityColor(task.priority!)
            const isCompleted = task.status === "completed"

            return (
              <div
                key={task.id}
                onClick={() => onOpen(task as Task)}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl border transition-all hover:bg-muted/50 group cursor-pointer hover:shadow-sm",
                  isCompleted ? "opacity-60 bg-muted/20" : "bg-card/50",
                  priorityColor.border
                )}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="mt-1 shrink-0 text-muted-foreground">
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <Circle className="h-5 w-5 hover:text-primary transition-colors" />
                    )}
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <label
                        className={cn(
                          "text-sm font-medium leading-none cursor-pointer truncate mr-2",
                          isCompleted && "line-through text-muted-foreground"
                        )}
                      >
                        {task.title}
                      </label>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center shrink-0">
                        <Clock className="mr-1 h-3 w-3" />
                        {task.due_time}
                      </span>
                      {task.category && (
                        <Badge variant="secondary" className="h-5 px-1.5 text-[10px]" style={{ backgroundColor: `${task.category.color}20`, color: task.category.color }}>
                          {task.category.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
