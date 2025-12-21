"use client"

import { useState, useTransition, useEffect, useCallback } from "react"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Calendar,
  Clock,
  Flag,
  CheckCircle2,
  Edit,
  Trash2,
  X,
  Repeat,
  MessageCircle,
  Users,
  Send,
  MoreHorizontal,
  UserPlus,
  Reply,
} from "lucide-react"
import { toast } from "sonner"
import {
  updateRecurringActivity,
  cancelRecurringInstance,
  deleteRecurringSeries,
  deleteThisAndFuture,
  updateActivity,
  createActivityComment,
  deleteActivityComment,
  addActivityParticipant,
  removeParticipant,
  updateParticipant,
} from "@/actions/activities"
import { CalendarActivity, ActivityWithParticipants, RecurrenceEditMode, ActivityComment, ActivityParticipant } from "@/types/database"
import { getRecurrenceDescription } from "@/lib/recurrence"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type DeleteMode = "this_occurrence" | "this_and_future" | "all_occurrences"

interface ActivityDetailDialogProps {
  activity: CalendarActivity | ActivityWithParticipants | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface CommentWithUser extends ActivityComment {
  user?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
}

export function ActivityDetailDialog({ activity, open, onOpenChange }: ActivityDetailDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEditOptions, setShowEditOptions] = useState(false)
  const [deleteMode, setDeleteMode] = useState<DeleteMode | null>(null)
  const [activeTab, setActiveTab] = useState("details")
  const [comments, setComments] = useState<CommentWithUser[]>([])
  const [newComment, setNewComment] = useState("")
  const [loadingComments, setLoadingComments] = useState(false)
  const [showAddParticipant, setShowAddParticipant] = useState(false)
  const [participantEmail, setParticipantEmail] = useState("")
  const [participantRole, setParticipantRole] = useState<"VIEWER" | "COMMENTER" | "EDITOR">("VIEWER")
  const router = useRouter()

  // Get activity properties with support for both formats
  const getActivityProps = useCallback(() => {
    if (!activity) return null

    const isRecurring = ('isRecurring' in activity && activity.isRecurring) ||
      ('is_recurring' in activity && activity.is_recurring) || false
    const isInstance = ('isInstance' in activity && activity.isInstance) || false
    const activityId = ('activityId' in activity && activity.activityId) || activity.id
    const instanceId = ('instanceId' in activity && activity.instanceId) || null

    const occurrenceAt = ('occurrenceAt' in activity && activity.occurrenceAt)
      ? (activity.occurrenceAt instanceof Date ? activity.occurrenceAt : new Date(activity.occurrenceAt))
      : ('start_at' in activity && activity.start_at)
        ? new Date(activity.start_at)
        : ('due_at' in activity && activity.due_at)
          ? new Date(activity.due_at)
          : null

    const startAt = ('startAt' in activity && activity.startAt)
      ? (activity.startAt instanceof Date ? activity.startAt : new Date(activity.startAt))
      : ('start_at' in activity && activity.start_at)
        ? new Date(activity.start_at)
        : null

    const endAt = ('endAt' in activity && activity.endAt)
      ? (activity.endAt instanceof Date ? activity.endAt : new Date(activity.endAt))
      : ('end_at' in activity && activity.end_at)
        ? new Date(activity.end_at)
        : null

    const dueAt = ('dueAt' in activity && activity.dueAt)
      ? (activity.dueAt instanceof Date ? activity.dueAt : new Date(activity.dueAt))
      : ('due_at' in activity && activity.due_at)
        ? new Date(activity.due_at)
        : null

    const isAllDay = ('isAllDay' in activity && activity.isAllDay) ||
      ('is_all_day' in activity && activity.is_all_day) || false

    const recurrenceRule = ('recurrenceRule' in activity && activity.recurrenceRule) ||
      ('recurrence_rule' in activity && activity.recurrence_rule) || null

    return {
      isRecurring,
      isInstance,
      activityId,
      instanceId,
      occurrenceAt,
      startAt,
      endAt,
      dueAt,
      isAllDay,
      recurrenceRule,
    }
  }, [activity])

  const props = getActivityProps()

  // Load comments when tab changes
  useEffect(() => {
    if (activeTab === "comments" && activity && props) {
      loadComments()
    }
  }, [activeTab, activity])

  const loadComments = async () => {
    if (!activity || !props) return

    setLoadingComments(true)
    try {
      const supabase = createClient()
      
      let query = supabase
        .from("activity_comments")
        .select(`
          *,
          user:users(id, full_name, avatar_url)
        `)
        .eq("activity_id", props.activityId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true })

      // If it's an instance, get both activity-level and instance-specific comments
      if (props.instanceId) {
        query = query.or(`activity_instance_id.eq.${props.instanceId},activity_instance_id.is.null`)
      } else {
        query = query.is("activity_instance_id", null)
      }

      const { data, error } = await query

      if (!error && data) {
        setComments(data as CommentWithUser[])
      }
    } catch (error) {
      console.error("Error loading comments:", error)
    } finally {
      setLoadingComments(false)
    }
  }

  if (!activity || !props) return null

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

  const priority = priorityConfig[activity.priority || "MEDIUM"]
  const status = statusConfig[activity.status || "TODO"]
  const categoryColor = activity.category?.color || '#64748b'
  const recurrenceText = props.recurrenceRule ? getRecurrenceDescription(props.recurrenceRule) : null
  const participants = activity.participants || []

  const handleMarkAsDone = () => {
    startTransition(async () => {
      let result

      if (props.isRecurring && props.isInstance && props.occurrenceAt) {
        result = await updateRecurringActivity({
          activityId: props.activityId,
          occurrenceAt: props.occurrenceAt,
          editMode: "this_occurrence",
          updates: { status: "DONE" }
        })
      } else {
        result = await updateActivity({
          id: props.activityId,
          status: "DONE"
        })
      }

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Marked as done")
        onOpenChange(false)
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
          if (props.occurrenceAt) {
            result = await cancelRecurringInstance(props.activityId, props.occurrenceAt)
          }
          break
        case "this_and_future":
          if (props.occurrenceAt) {
            result = await deleteThisAndFuture(props.activityId, props.occurrenceAt)
          }
          break
        case "all_occurrences":
          result = await deleteRecurringSeries(props.activityId)
          break
      }

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Deleted successfully")
        setShowDeleteConfirm(false)
        onOpenChange(false)
        router.refresh()
      }
    })
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    startTransition(async () => {
      const result = await createActivityComment({
        activityId: props.activityId,
        instanceId: props.instanceId,
        content: newComment.trim(),
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        setNewComment("")
        loadComments()
        toast.success("Comment added")
      }
    })
  }

  const handleDeleteComment = async (commentId: string) => {
    startTransition(async () => {
      const result = await deleteActivityComment(commentId)

      if (result.error) {
        toast.error(result.error)
      } else {
        loadComments()
        toast.success("Comment deleted")
      }
    })
  }

  const handleAddParticipant = async () => {
    if (!participantEmail.trim()) return

    // First find the user by email
    const supabase = createClient()
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", participantEmail.trim())
      .single()

    if (userError || !userData) {
      toast.error("User not found")
      return
    }

    startTransition(async () => {
      const result = await addActivityParticipant({
        activityId: props.activityId,
        userId: userData.id,
        role: participantRole,
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        setParticipantEmail("")
        setShowAddParticipant(false)
        toast.success("Participant added")
        router.refresh()
      }
    })
  }

  const handleRemoveParticipant = async (participantId: string) => {
    startTransition(async () => {
      const result = await removeParticipant(participantId)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Participant removed")
        router.refresh()
      }
    })
  }

  const handleUpdateParticipantRole = async (participantId: string, role: "VIEWER" | "COMMENTER" | "EDITOR") => {
    startTransition(async () => {
      const result = await updateParticipant(participantId, { role })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Role updated")
        router.refresh()
      }
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] p-0 gap-0 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="relative px-6 pt-6 pb-4 border-b bg-gradient-to-br from-background to-muted/20 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 h-8 w-8 hover:bg-background/80"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="pr-8 space-y-2">
              {activity.category && (
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full ring-2 ring-offset-2 ring-offset-background"
                    style={{
                      backgroundColor: categoryColor,
                      boxShadow: `0 0 8px ${categoryColor}40`
                    }}
                  />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {activity.category.name}
                  </span>
                </div>
              )}
              <DialogTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
                {activity.title}
                {props.isRecurring && (
                  <Badge variant="secondary" className="text-xs">
                    <Repeat className="h-3 w-3 mr-1" />
                    Recurring
                  </Badge>
                )}
              </DialogTitle>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0 shrink-0">
              <TabsTrigger
                value="details"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
              >
                Details
              </TabsTrigger>
              <TabsTrigger
                value="comments"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Comments
                {comments.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                    {comments.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="participants"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
              >
                <Users className="h-4 w-4 mr-2" />
                Participants
                {participants.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                    {participants.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              {/* Details Tab */}
              <TabsContent value="details" className="h-full m-0">
                <ScrollArea className="h-full">
                  <div className="p-6 space-y-6">
                    {activity.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {activity.description}
                      </p>
                    )}

                    {/* Date/Time Info */}
                    <div className="space-y-2">
                      {(props.startAt || props.dueAt) && (
                        <div className="group flex items-center gap-4 px-4 py-3 rounded-lg bg-muted/50">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
                              {activity.type === 'EVENT' ? 'Start Time' : 'Due Date'}
                            </p>
                            <p className="text-sm font-semibold">
                              {format(
                                props.startAt || props.dueAt!,
                                props.isAllDay ? "EEEE, MMMM d, yyyy" : "EEE, MMM d, yyyy · h:mm a"
                              )}
                            </p>
                          </div>
                        </div>
                      )}

                      {activity.type === 'EVENT' && props.endAt && (
                        <div className="group flex items-center gap-4 px-4 py-3 rounded-lg bg-muted/50">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
                              End Time
                            </p>
                            <p className="text-sm font-semibold">
                              {format(props.endAt, props.isAllDay ? "EEEE, MMMM d, yyyy" : "EEE, MMM d, yyyy · h:mm a")}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Status & Priority */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/50">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
                              Status
                            </p>
                            <p className="text-sm font-semibold">
                              <span className="mr-1">{status.icon}</span>
                              {status.label}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/50">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Flag className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
                              Priority
                            </p>
                            <p className="text-sm font-semibold">
                              <span className="mr-1">{priority.icon}</span>
                              {priority.label}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Recurrence Info */}
                      {props.isRecurring && recurrenceText && (
                        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 border border-primary/20">
                          <Repeat className="h-4 w-4 text-primary" />
                          <div className="flex-1">
                            <span className="text-sm font-semibold text-primary">
                              Recurring {activity.type === 'EVENT' ? 'Event' : 'Task'}
                            </span>
                            <p className="text-xs text-primary/70 capitalize">
                              {recurrenceText}
                            </p>
                          </div>
                          {props.isInstance && (
                            <Badge variant="secondary" className="text-xs">
                              Instance
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 pt-2">
                      {activity.status !== "DONE" && (
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={handleMarkAsDone}
                          disabled={isPending}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Mark as Done {props.isInstance ? "(This occurrence)" : ""}
                        </Button>
                      )}

                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          onClick={() => {
                            if (props.isRecurring) {
                              setShowEditOptions(true)
                            } else {
                              toast.info("Edit functionality coming soon")
                            }
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>

                        <Button
                          variant="outline"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (props.isRecurring) {
                              setShowDeleteConfirm(true)
                            } else {
                              handleDelete("all_occurrences")
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Comments Tab */}
              <TabsContent value="comments" className="h-full m-0 flex flex-col">
                <ScrollArea className="flex-1">
                  <div className="p-6 space-y-4">
                    {loadingComments ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Loading comments...
                      </div>
                    ) : comments.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No comments yet</p>
                        <p className="text-xs">Be the first to comment</p>
                      </div>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={comment.user?.avatar_url || undefined} />
                            <AvatarFallback>
                              {comment.user?.full_name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {comment.user?.full_name || "Unknown User"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(comment.created_at), "MMM d, h:mm a")}
                              </span>
                              {comment.activity_instance_id && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  Instance
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {comment.content}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                                <Reply className="h-3 w-3 mr-1" />
                                Reply
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                    <MoreHorizontal className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleDeleteComment(comment.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>

                {/* Comment Input */}
                <div className="p-4 border-t bg-muted/30">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[60px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleAddComment()
                        }
                      }}
                    />
                    <Button
                      size="icon"
                      onClick={handleAddComment}
                      disabled={isPending || !newComment.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  {props.isInstance && (
                    <p className="text-xs text-muted-foreground mt-2">
                      💡 This comment will be attached to this specific occurrence
                    </p>
                  )}
                </div>
              </TabsContent>

              {/* Participants Tab */}
              <TabsContent value="participants" className="h-full m-0 flex flex-col">
                <ScrollArea className="flex-1">
                  <div className="p-6 space-y-4">
                    {/* Add Participant */}
                    {showAddParticipant ? (
                      <div className="p-4 border rounded-lg space-y-3">
                        <Input
                          placeholder="Enter email address"
                          value={participantEmail}
                          onChange={(e) => setParticipantEmail(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Select
                            value={participantRole}
                            onValueChange={(v) => setParticipantRole(v as any)}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="VIEWER">Viewer</SelectItem>
                              <SelectItem value="COMMENTER">Commenter</SelectItem>
                              <SelectItem value="EDITOR">Editor</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button onClick={handleAddParticipant} disabled={isPending}>
                            Add
                          </Button>
                          <Button variant="ghost" onClick={() => setShowAddParticipant(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setShowAddParticipant(true)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Participant
                      </Button>
                    )}

                    {/* Participants List */}
                    {participants.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No participants yet</p>
                        <p className="text-xs">Add people to collaborate on this {activity.type?.toLowerCase()}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {participants.map((participant: any) => (
                          <div
                            key={participant.id}
                            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                          >
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={participant.user?.avatar_url || undefined} />
                              <AvatarFallback>
                                {participant.user?.full_name?.charAt(0) || participant.user?.email?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {participant.user?.full_name || participant.user?.email || "Unknown"}
                              </p>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {participant.role}
                                </Badge>
                                <Badge
                                  variant={participant.status === "ACCEPTED" ? "default" : "outline"}
                                  className="text-xs"
                                >
                                  {participant.status}
                                </Badge>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleUpdateParticipantRole(participant.id, "VIEWER")}>
                                  Set as Viewer
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateParticipantRole(participant.id, "COMMENTER")}>
                                  Set as Commenter
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateParticipantRole(participant.id, "EDITOR")}>
                                  Set as Editor
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleRemoveParticipant(participant.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ))}
                      </div>
                    )}

                    {props.isRecurring && (
                      <p className="text-xs text-muted-foreground text-center">
                        ℹ️ Participants apply to all occurrences of this recurring {activity.type?.toLowerCase()}
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              Delete {props.isRecurring ? "Recurring " : ""}{activity.type === 'EVENT' ? 'Event' : 'Task'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {props.isRecurring ? (
              <>
                <p className="text-sm text-muted-foreground">
                  This is a recurring {activity.type?.toLowerCase()}. What would you like to delete?
                </p>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => confirmDelete()}
                    disabled={isPending}
                  >
                    This occurrence only
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => { setDeleteMode("this_and_future"); confirmDelete() }}
                    disabled={isPending}
                  >
                    This and all future occurrences
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full justify-start"
                    onClick={() => { setDeleteMode("all_occurrences"); confirmDelete() }}
                    disabled={isPending}
                  >
                    All occurrences
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete this {activity.type?.toLowerCase()}? This action cannot be undone.
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            {!props.isRecurring && (
              <Button variant="destructive" onClick={confirmDelete} disabled={isPending}>
                Delete
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Options Dialog */}
      <Dialog open={showEditOptions} onOpenChange={setShowEditOptions}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit Recurring {activity.type === 'EVENT' ? 'Event' : 'Task'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              This is a recurring {activity.type?.toLowerCase()}. What would you like to edit?
            </p>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setShowEditOptions(false)
                  toast.info("Edit this occurrence - coming soon")
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
                  toast.info("Edit all occurrences - coming soon")
                }}
              >
                All occurrences
              </Button>
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="ghost" onClick={() => setShowEditOptions(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
