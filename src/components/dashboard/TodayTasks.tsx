"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Clock } from "lucide-react"
import { ActivityWithParticipants } from "@/types/database"
import { format } from "date-fns"

interface TodayTasksProps {
  activities: ActivityWithParticipants[]
}

export function TodayTasks({ activities }: TodayTasksProps) {
  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-3 glass">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Today&apos;s Schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 && (
            <p className="text-sm text-muted-foreground">No tasks for today.</p>
          )}
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-accent/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-2 w-2 rounded-full",
                  activity.priority === "HIGH" || activity.priority === "URGENT" ? "bg-red-500" :
                  activity.priority === "MEDIUM" ? "bg-yellow-500" : "bg-green-500"
                )} />
                <div>
                  <p className={cn(
                    "font-medium text-sm",
                    activity.status === "DONE" && "line-through text-muted-foreground"
                  )}>
                    {activity.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {activity.type === "EVENT" && activity.start_at && (
                      <span>{format(new Date(activity.start_at), "h:mm a")}</span>
                    )}
                    {activity.type === "TASK" && activity.due_at && (
                      <span>Due {format(new Date(activity.due_at), "h:mm a")}</span>
                    )}
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="text-xs font-normal">
                {activity.status?.replace("_", " ")}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
