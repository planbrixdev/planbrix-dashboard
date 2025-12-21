"use client"

import { useState, useTransition, useEffect, useCallback } from "react"
import { format } from "date-fns"
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
  MapPin,
  Tag,
  CalendarDays,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"
import {
  updateRecurringActivity,
  cancelRecurringInstance,
  deleteRecurringSeries,
  deleteThisAndFuture,
  updateActivity,
  deleteActivity,
  createActivityComment,
  deleteActivityComment,
  addActivityParticipant,
  removeParticipant,
  updateParticipant,
} from "@/actions/activities"
import { CalendarActivity, ActivityWithParticipants, ActivityComment } from "@/types/database"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"


type ActivityData = CalendarActivity | ActivityWithParticipants

interface ActivityDetailPanelProps {
  activity: ActivityData | null
  onClose?: () => void
}

interface CommentWithUser extends ActivityComment {
  user?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
}

// Helper functions
function getActivityProps(activity: ActivityData | null) {
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
}

export function ActivityDetailPanel({ activity, onClose }: ActivityDetailPanelProps) {
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState("details")
  const [comments, setComments] = useState<CommentWithUser[]>([])
  const [newComment, setNewComment] = useState("")
  const [loadingComments, setLoadingComments] = useState(false)
  const [showAddParticipant, setShowAddParticipant] = useState(false)
  const [participantEmail, setParticipantEmail] = useState("")
  const [participantRole, setParticipantRole] = useState<"VIEWER" | "COMMENTER" | "EDITOR">("VIEWER")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const router = useRouter()

  const props = getActivityProps(activity)

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

  if (!activity || !props) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20 rounded-lg border-2 border-dashed">
        <div className="text-center p-8">
          <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">No activity selected</h3>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Select an activity from the list to view details
          </p>
        </div>
      </div>
    )
  }

  const priorityConfig: Record<string, { icon: string; label: string; color: string }> = {
    LOW: { icon: "🟢", label: "Low", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" },
    MEDIUM: { icon: "🟡", label: "Medium", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100" },
    HIGH: { icon: "🟠", label: "High", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100" },
    URGENT: { icon: "🔴", label: "Urgent", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100" },
  }

  const statusConfig: Record<string, { icon: string; label: string; color: string }> = {
    TODO: { icon: "⭕", label: "To Do", color: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100" },
    IN_PROGRESS: { icon: "🔄", label: "In Progress", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100" },
    DONE: { icon: "✅", label: "Completed", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" },
    CANCELLED: { icon: "❌", label: "Cancelled", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100" },
  }

  const priority = priorityConfig[activity.priority || "MEDIUM"]
  const status = statusConfig[activity.status || "TODO"]
  const categoryColor = activity.category?.color || '#64748b'
  const recurrenceText = props.recurrenceRule ? getRecurrenceDescription(props.recurrenceRule) : null
  const participants = activity.participants || []

  const handleMarkAsDone = (mode: "this_occurrence" | "all" = "all") => {
    startTransition(async () => {
      let result

      if (props.isRecurring && mode === "this_occurrence" && props.occurrenceAt) {
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
        router.refresh()
      }
    })
  }

  const handleDelete = (mode: "this_occurrence" | "this_and_future" | "all") => {
    startTransition(async () => {
      let result

      switch (mode) {
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
        case "all":
          if (props.isRecurring) {
            result = await deleteRecurringSeries(props.activityId)
          } else {
            result = await deleteActivity(props.activityId)
          }
          break
      }

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Deleted successfully")
        setShowDeleteDialog(false)
        onClose?.()
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
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="relative px-6 pt-6 pb-4 border-b bg-gradient-to-br from-background to-muted/30">
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 h-8 w-8 lg:hidden"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        <div className="space-y-3">
          {/* Category & Type badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {activity.category && (
              <Badge 
                variant="secondary"
                className="gap-1.5"
                style={{ 
                  backgroundColor: `${categoryColor}20`,
                  color: categoryColor,
                  borderColor: categoryColor
                }}
              >
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: categoryColor }}
                />
                {activity.category.name}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {activity.type}
            </Badge>
            {props.isRecurring && (
              <Badge variant="secondary" className="gap-1">
                <Repeat className="h-3 w-3" />
                {props.isInstance ? "Instance" : "Recurring"}
              </Badge>
            )}
          </div>

          {/* Title */}
          <h1 className="text-xl font-bold tracking-tight pr-8">
            {activity.title}
          </h1>

          {/* Status & Priority inline */}
          <div className="flex items-center gap-2">
            <Badge className={cn("text-xs", status.color)}>
              {status.icon} {status.label}
            </Badge>
            <Badge className={cn("text-xs", priority.color)}>
              {priority.icon} {priority.label}
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 py-3 shrink-0">
          <TabsList className="w-full h-10 bg-muted/50 p-1 rounded-lg gap-1">
            <TabsTrigger
              value="details"
              className="flex-1 rounded-md h-full text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground"
            >
              Details
            </TabsTrigger>
            <TabsTrigger
              value="comments"
              className="flex-1 rounded-md h-full text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground"
            >
              <MessageCircle className="h-4 w-4 mr-1.5" />
              Comments
              {comments.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px] font-semibold">
                  {comments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="participants"
              className="flex-1 rounded-md h-full text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground"
            >
              <Users className="h-4 w-4 mr-1.5" />
              People
              {participants.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px] font-semibold">
                  {participants.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          {/* Details Tab */}
          <TabsContent value="details" className="h-full m-0">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6">
                {/* Description */}
                {activity.description && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {activity.description}
                    </p>
                  </div>
                )}

                {/* Schedule Info */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Schedule</h4>
                  
                  {(props.startAt || props.dueAt) && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {activity.type === 'EVENT' ? 'Start' : 'Due Date'}
                        </p>
                        <p className="text-sm font-medium">
                          {format(
                            props.startAt || props.dueAt!,
                            props.isAllDay ? "EEEE, MMMM d, yyyy" : "EEE, MMM d, yyyy · h:mm a"
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  {activity.type === 'EVENT' && props.endAt && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">End</p>
                        <p className="text-sm font-medium">
                          {format(props.endAt, props.isAllDay ? "EEEE, MMMM d, yyyy" : "EEE, MMM d, yyyy · h:mm a")}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Recurrence Info */}
                  {props.isRecurring && recurrenceText && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <Repeat className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-primary capitalize">
                          {recurrenceText}
                        </p>
                        {props.isInstance && (
                          <p className="text-xs text-primary/70">
                            This is one occurrence of a recurring {activity.type?.toLowerCase()}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Actions */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Actions</h4>
                  
                  {activity.status !== "DONE" && (
                    props.isRecurring ? (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleMarkAsDone("this_occurrence")}
                          disabled={isPending}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Complete This
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleMarkAsDone("all")}
                          disabled={isPending}
                        >
                          Complete All
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleMarkAsDone("all")}
                        disabled={isPending}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Mark as Done
                      </Button>
                    )
                  )}

                  <div className="flex gap-2">
                    <Button className="flex-1" variant="default">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setShowDeleteDialog(true)}
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
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {comment.content}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          Delete
                        </Button>
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
            </div>
          </TabsContent>

          {/* Participants Tab */}
          <TabsContent value="participants" className="h-full m-0">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-4">
                {/* Add Participant */}
                {showAddParticipant ? (
                  <div className="p-4 border rounded-lg space-y-3 bg-muted/30">
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
                            {participant.user?.full_name?.charAt(0) || "U"}
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
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Delete {activity.type === 'EVENT' ? 'Event' : 'Task'}
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
                    onClick={() => handleDelete("all")}
                    disabled={isPending}
                  >
                    All occurrences
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete this {activity.type?.toLowerCase()}? This action cannot be undone.
                </p>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => handleDelete("all")}
                  disabled={isPending}
                >
                  Delete
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
