"use client"

import { useTransition } from "react"
import { format } from "date-fns"
import {
  MoreHorizontal,
  CheckCircle2,
  Calendar,
  Clock,
  Repeat,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

import { ActivityWithParticipants } from "@/types/database"
import { updateActivity } from "@/actions/activities"
import { ActivityStatus, ActivityPriority } from "@/lib/validations/activities"

interface ActivityCardProps {
  activity: ActivityWithParticipants
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const [isPending, startTransition] = useTransition()

  const handleMarkAsDone = () => {
    startTransition(async () => {
      const result = await updateActivity({
        id: activity.id,
        status: ActivityStatus.DONE,
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Activity marked as done")
      }
    })
  }

  const priorityColor = {
    [ActivityPriority.LOW]: "bg-slate-500",
    [ActivityPriority.MEDIUM]: "bg-blue-500",
    [ActivityPriority.HIGH]: "bg-orange-500",
    [ActivityPriority.URGENT]: "bg-red-500",
  }

  const statusColor = {
    [ActivityStatus.TODO]: "bg-slate-100 text-slate-800",
    [ActivityStatus.IN_PROGRESS]: "bg-blue-100 text-blue-800",
    [ActivityStatus.DONE]: "bg-green-100 text-green-800",
    [ActivityStatus.CANCELLED]: "bg-red-100 text-red-800",
  }

  return (
    <Card className={cn("w-full", activity.status === ActivityStatus.DONE && "opacity-60")}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold leading-none">
              {activity.title}
            </CardTitle>
            {activity.is_recurring && (
              <Repeat className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {activity.type === "TASK" && activity.due_at && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Due {format(new Date(activity.due_at), "MMM d")}
              </span>
            )}
            {activity.type === "EVENT" && activity.start_at && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(activity.start_at), "MMM d, h:mm a")}
              </span>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleMarkAsDone}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark as Done
            </DropdownMenuItem>
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className={cn("text-xs font-normal", statusColor[activity.status as keyof typeof statusColor])}
          >
            {activity.status?.replace("_", " ")}
          </Badge>
          <div className="flex items-center gap-1">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                priorityColor[activity.priority as keyof typeof priorityColor]
              )}
            />
            <span className="text-xs text-muted-foreground capitalize">
              {activity.priority?.toLowerCase()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
