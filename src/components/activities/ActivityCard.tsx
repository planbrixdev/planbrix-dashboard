"use client"

import { useState, useTransition } from "react"
import { format } from "date-fns"
import {
  MoreHorizontal,
  CheckCircle2,
  Calendar,
  Clock,
  Repeat,
  AlertCircle,
  Edit,
  Trash2,
  Users,
  MessageCircle,
  Eye,
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
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { ActivityWithParticipants, CalendarActivity } from "@/types/database"
import {
  updateActivity,
  updateRecurringActivity,
  cancelRecurringInstance,
  deleteRecurringSeries,
  deleteThisAndFuture,
  deleteActivity,
} from "@/actions/activities"
import { ActivityStatus, ActivityPriority } from "@/lib/validations/activities"
import { ActivityDetailDialog } from "./ActivityDetailDialog"
import { useRouter } from "next/navigation"
import { getRecurrenceDescription } from "@/lib/recurrence"

// Union type to support both formats
type ActivityData = CalendarActivity | ActivityWithParticipants

interface ActivityCardProps {
  activity: ActivityData
  onOpenDetail?: (activity: ActivityData) => void
}

// Helper functions to get properties from either format
function getIsRecurring(activity: ActivityData): boolean {
  if ('isRecurring' in activity) return !!activity.isRecurring
  if ('is_recurring' in activity) return !!activity.is_recurring
  return false
}

function getIsInstance(activity: ActivityData): boolean {
  if ('isInstance' in activity) return !!activity.isInstance
  return false
}

function getActivityId(activity: ActivityData): string {
  if ('activityId' in activity && activity.activityId) return activity.activityId
  return activity.id
}

function getInstanceId(activity: ActivityData): string | undefined {
  if ('instanceId' in activity) return activity.instanceId ?? undefined
  return undefined
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

function getEndAt(activity: ActivityData): string | Date | null {
  if ('endAt' in activity) return activity.endAt || null
  if ('end_at' in activity) return activity.end_at
  return null
}

function getRecurrenceRule(activity: ActivityData): string | null {
  if ('recurrenceRule' in activity) return activity.recurrenceRule || null
  if ('recurrence_rule' in activity) return activity.recurrence_rule
  return null
}

export function ActivityCard({ activity, onOpenDetail }: ActivityCardProps) {
  const [isPending, startTransition] = useTransition()
  const [showDetail, setShowDetail] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const router = useRouter()

  const isRecurring = getIsRecurring(activity)
  const isInstance = getIsInstance(activity)
  const activityId = getActivityId(activity)
  const instanceId = getInstanceId(activity)
  const occurrenceAt = getOccurrenceAt(activity)
  const startAt = getStartAt(activity)
  const dueAt = getDueAt(activity)
  const recurrenceRule = getRecurrenceRule(activity)

  const handleMarkAsDone = (mode: "this_occurrence" | "all" = "all") => {
    startTransition(async () => {
      let result

      if (isRecurring && mode === "this_occurrence" && occurrenceAt) {
        // Mark only this occurrence as done
        result = await updateRecurringActivity({
          activityId: activityId,
          occurrenceAt: occurrenceAt,
          editMode: "this_occurrence",
          updates: { status: "DONE" }
        })
      } else {
        // Mark the whole activity as done
        result = await updateActivity({
          id: activityId,
          status: ActivityStatus.DONE,
        })
      }

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(isRecurring && mode === "this_occurrence" 
          ? "This occurrence marked as done" 
          : "Activity marked as done")
        router.refresh()
      }
    })
  }

  const handleDelete = (mode: "this_occurrence" | "this_and_future" | "all") => {
    startTransition(async () => {
      let result

      switch (mode) {
        case "this_occurrence":
          if (occurrenceAt) {
            result = await cancelRecurringInstance(activityId, occurrenceAt)
          }
          break
        case "this_and_future":
          if (occurrenceAt) {
            result = await deleteThisAndFuture(activityId, occurrenceAt)
          }
          break
        case "all":
          if (isRecurring) {
            result = await deleteRecurringSeries(activityId)
          } else {
            result = await deleteActivity(activityId)
          }
          break
      }

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Deleted successfully")
        router.refresh()
      }
    })
  }

  const handleOpenDetail = () => {
    if (onOpenDetail) {
      onOpenDetail(activity)
    } else {
      setShowDetail(true)
    }
  }

  const priorityColor = {
    [ActivityPriority.LOW]: "bg-slate-500",
    [ActivityPriority.MEDIUM]: "bg-blue-500",
    [ActivityPriority.HIGH]: "bg-orange-500",
    [ActivityPriority.URGENT]: "bg-red-500",
  }

  const statusColor = {
    [ActivityStatus.TODO]: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
    [ActivityStatus.IN_PROGRESS]: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
    [ActivityStatus.DONE]: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
    [ActivityStatus.CANCELLED]: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  }

  const categoryColor = activity.category?.color || '#64748b'
  const recurrenceText = recurrenceRule ? getRecurrenceDescription(recurrenceRule) : null
  const participants = activity.participants || []

  // Get display date
  const displayDate = occurrenceAt || (startAt ? new Date(startAt) : null) || (dueAt ? new Date(dueAt) : null)

  return (
    <>
      <Card 
        className={cn(
          "w-full transition-all hover:shadow-md cursor-pointer group relative overflow-hidden",
          activity.status === ActivityStatus.DONE && "opacity-60"
        )}
        onClick={handleOpenDetail}
      >
        {/* Category color indicator */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ backgroundColor: categoryColor }}
        />

        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pl-4">
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base font-semibold leading-none truncate">
                {activity.title}
              </CardTitle>
              {isRecurring && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 shrink-0">
                  <Repeat className="h-3 w-3 mr-1" />
                  {isInstance ? "Instance" : "Recurring"}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              {activity.type === "TASK" && displayDate && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Due {format(displayDate, "MMM d")}
                </span>
              )}
              {activity.type === "EVENT" && displayDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(displayDate, "MMM d, h:mm a")}
                </span>
              )}
              {recurrenceText && (
                <span className="text-primary/70 capitalize">
                  • {recurrenceText}
                </span>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={handleOpenDetail}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />

              {/* Mark as Done options */}
              {activity.status !== ActivityStatus.DONE && (
                isRecurring ? (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Mark as Done
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => handleMarkAsDone("this_occurrence")}>
                        This occurrence only
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleMarkAsDone("all")}>
                        All occurrences
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                ) : (
                  <DropdownMenuItem onClick={() => handleMarkAsDone("all")}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark as Done
                  </DropdownMenuItem>
                )
              )}

              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Delete options */}
              {isRecurring ? (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={() => handleDelete("this_occurrence")}
                    >
                      This occurrence only
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={() => handleDelete("this_and_future")}
                    >
                      This and future occurrences
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={() => handleDelete("all")}
                    >
                      All occurrences
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ) : (
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={() => handleDelete("all")}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="pl-4">
          <div className="flex items-center gap-2 flex-wrap">
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
            {activity.category && (
              <Badge 
                variant="outline" 
                className="text-xs"
                style={{ borderColor: categoryColor, color: categoryColor }}
              >
                {activity.category.name}
              </Badge>
            )}
            {participants.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                {participants.length}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Activity Detail Dialog */}
      <ActivityDetailDialog
        activity={activity}
        open={showDetail}
        onOpenChange={setShowDetail}
      />
    </>
  )
}
