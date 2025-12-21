"use client"

import { useState, useTransition } from "react"
import { useEventDetail } from "@/hooks/use-event-detail"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Flag, CheckCircle2, Edit, Trash2, X, Repeat, MessageCircle, Users } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { 
  updateRecurringActivity, 
  cancelRecurringInstance, 
  deleteRecurringSeries, 
  deleteThisAndFuture,
  updateActivity 
} from "@/actions/activities"
import { RecurrenceEditMode } from "@/types/database"
import { getRecurrenceDescription } from "@/lib/recurrence"
import { useRouter } from "next/navigation"

type DeleteMode = "this_occurrence" | "this_and_future" | "all_occurrences"

export function EventDetailDialog() {
  const { isOpen, selectedEvent, onClose } = useEventDetail()
  const [isPending, startTransition] = useTransition()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEditOptions, setShowEditOptions] = useState(false)
  const [deleteMode, setDeleteMode] = useState<DeleteMode | null>(null)
  const router = useRouter()

  if (!selectedEvent) return null

  const priorityConfig: Record<string, { icon: string; label: string; color: string }> = {
    LOW: { icon: "🟢", label: "Low", color: "bg-green-100 text-green-800" },
    MEDIUM: { icon: "🟡", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
    HIGH: { icon: "🟠", label: "High", color: "bg-orange-100 text-orange-800" },
    URGENT: { icon: "🔴", label: "Urgent", color: "bg-red-100 text-red-800" },
  }

  const statusConfig: Record<string, { icon: string; label: string }> = {
    TODO: { icon: "⭕", label: "To Do" },
    IN_PROGRESS: { icon: "🔄", label: "In Progress" },
    DONE: { icon: "✅", label: "Completed" },
    CANCELLED: { icon: "❌", label: "Cancelled" },
  }

  const priority = priorityConfig[selectedEvent.priority || "MEDIUM"]
  const status = statusConfig[selectedEvent.status || "TODO"]
  const categoryColor = selectedEvent.category?.color || '#64748b'

  // Check if this is a recurring instance
  const isRecurring = selectedEvent.is_recurring || selectedEvent.isRecurring
  const isInstance = selectedEvent.isInstance || !!selectedEvent.occurrenceAt
  const activityId = selectedEvent.activityId || selectedEvent.id
  const occurrenceAt = selectedEvent.occurrenceAt 
    ? new Date(selectedEvent.occurrenceAt) 
    : selectedEvent.start_at 
      ? new Date(selectedEvent.start_at)
      : selectedEvent.due_at 
        ? new Date(selectedEvent.due_at)
        : null

  const recurrenceText = selectedEvent.recurrence_rule || selectedEvent.recurrenceRule
    ? getRecurrenceDescription(selectedEvent.recurrence_rule || selectedEvent.recurrenceRule || "")
    : null

  const handleMarkAsDone = () => {
    startTransition(async () => {
      let result

      if (isRecurring && isInstance && occurrenceAt) {
        // Update specific instance
        result = await updateRecurringActivity({
          activityId,
          occurrenceAt,
          editMode: "this_occurrence",
          updates: { status: "DONE" }
        })
      } else {
        // Update entire activity
        result = await updateActivity({
          id: activityId,
          status: "DONE"
        })
      }

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Marked as done")
        onClose()
        router.refresh()
      }
    })
  }

  const handleDelete = (mode: DeleteMode) => {
    setDeleteMode(mode)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    if (!deleteMode) return

    startTransition(async () => {
      let result

      switch (deleteMode) {
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
        case "all_occurrences":
          result = await deleteRecurringSeries(activityId)
          break
      }

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Deleted successfully")
        setShowDeleteConfirm(false)
        onClose()
        router.refresh()
      }
    })
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[500px] p-0 gap-0" showCloseButton={false}>
          {/* Elegant Header with subtle gradient */}
          <div className="relative px-6 pt-6 pb-5 border-b bg-gradient-to-br from-background to-muted/20">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 h-8 w-8 hover:bg-background/80"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="pr-8 space-y-3">
              {selectedEvent.category && (
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full ring-2 ring-offset-2 ring-offset-background" 
                    style={{ 
                      backgroundColor: categoryColor,
                      boxShadow: `0 0 8px ${categoryColor}40`
                    }}
                  />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {selectedEvent.category.name}
                  </span>
                </div>
              )}
              <DialogTitle className="text-2xl font-bold tracking-tight">
                {selectedEvent.title}
              </DialogTitle>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {selectedEvent.description && (
              <p className="text-sm text-muted-foreground leading-relaxed italic">
                {selectedEvent.description}
              </p>
            )}

            {/* Event Details - Elegant Cards */}
            <div className="space-y-2">
              {/* Date */}
              {(selectedEvent.start_at || selectedEvent.startAt || selectedEvent.due_at || selectedEvent.dueAt) && (
                <div className="group flex items-center gap-4 px-4 py-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-all">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
                      {selectedEvent.type === 'EVENT' ? 'Start Time' : 'Due Date'}
                    </p>
                    <p className="text-sm font-semibold truncate">
                      {format(
                        new Date(selectedEvent.startAt || selectedEvent.start_at || selectedEvent.dueAt || selectedEvent.due_at!), 
                        (selectedEvent.is_all_day || selectedEvent.isAllDay) ? "EEEE, MMMM d, yyyy" : "EEE, MMM d, yyyy · h:mm a"
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* End time for events */}
              {selectedEvent.type === 'EVENT' && (selectedEvent.end_at || selectedEvent.endAt) && (
                <div className="group flex items-center gap-4 px-4 py-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-all">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
                      End Time
                    </p>
                    <p className="text-sm font-semibold truncate">
                      {format(
                        new Date(selectedEvent.endAt || selectedEvent.end_at!), 
                        (selectedEvent.is_all_day || selectedEvent.isAllDay) ? "EEEE, MMMM d, yyyy" : "EEE, MMM d, yyyy · h:mm a"
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Status & Priority Row */}
              <div className="grid grid-cols-2 gap-2">
                <div className="group flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-all">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
                      Status
                    </p>
                    <p className="text-sm font-semibold truncate">
                      <span className="mr-1">{status.icon}</span>
                      {status.label}
                    </p>
                  </div>
                </div>

                <div className="group flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-all">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Flag className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
                      Priority
                    </p>
                    <p className="text-sm font-semibold truncate">
                      <span className="mr-1">{priority.icon}</span>
                      {priority.label}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recurring Badge */}
              {isRecurring && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 border border-primary/20">
                  <Repeat className="h-4 w-4 text-primary" />
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-primary">
                      Recurring {selectedEvent.type === 'EVENT' ? 'Event' : 'Task'}
                    </span>
                    {recurrenceText && (
                      <p className="text-xs text-primary/70 mt-0.5 capitalize">
                        {recurrenceText}
                      </p>
                    )}
                  </div>
                  {isInstance && (
                    <Badge variant="secondary" className="text-xs">
                      Instance
                    </Badge>
                  )}
                </div>
              )}

              {/* Participants Count */}
              {selectedEvent.participants && selectedEvent.participants.length > 0 && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/50">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {selectedEvent.participants.length} participant{selectedEvent.participants.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              {/* Mark as Done */}
              {selectedEvent.status !== "DONE" && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={handleMarkAsDone}
                  disabled={isPending}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark as Done {isInstance ? "(This occurrence)" : ""}
                </Button>
              )}

              <div className="flex gap-2">
                <Button 
                  className="flex-1 shadow-sm hover:shadow-md transition-shadow"
                  onClick={() => {
                    if (isRecurring) {
                      setShowEditOptions(true)
                    } else {
                      // Navigate to edit page or open edit modal
                      toast.info("Edit functionality coming soon")
                    }
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit {selectedEvent.type === 'EVENT' ? 'Event' : 'Task'}
                </Button>
                
                {/* Delete Button */}
                {isRecurring ? (
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 shadow-sm"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 shadow-sm"
                    onClick={() => handleDelete("all_occurrences")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation for Recurring */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Recurring {selectedEvent.type === 'EVENT' ? 'Event' : 'Task'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              This is a recurring {selectedEvent.type?.toLowerCase() || 'activity'}. What would you like to delete?
            </p>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleDelete("this_occurrence")}
                disabled={isPending}
              >
                This occurrence only
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleDelete("this_and_future")}
                disabled={isPending}
              >
                This and all future occurrences
              </Button>
              <Button
                variant="destructive"
                className="w-full justify-start"
                onClick={() => handleDelete("all_occurrences")}
                disabled={isPending}
              >
                All occurrences
              </Button>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Options for Recurring */}
      <Dialog open={showEditOptions} onOpenChange={setShowEditOptions}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit Recurring {selectedEvent.type === 'EVENT' ? 'Event' : 'Task'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              This is a recurring {selectedEvent.type?.toLowerCase() || 'activity'}. What would you like to edit?
            </p>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setShowEditOptions(false)
                  toast.info("Edit occurrence - coming soon")
                }}
              >
                This occurrence only
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setShowEditOptions(false)
                  toast.info("Edit this and future - coming soon")
                }}
              >
                This and all future occurrences
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setShowEditOptions(false)
                  toast.info("Edit all - coming soon")
                }}
              >
                All occurrences
              </Button>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowEditOptions(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
