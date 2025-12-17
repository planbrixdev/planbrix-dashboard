"use client"

import { useEventDetail } from "@/hooks/use-event-detail"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Flag, CheckCircle2, Edit, Trash2, X, Repeat } from "lucide-react"
import { format } from "date-fns"

export function EventDetailDialog() {
  const { isOpen, selectedEvent, onClose } = useEventDetail()

  if (!selectedEvent) return null

  const priorityConfig = {
    low: { bg: "bg-green-500", text: "text-green-500", label: "Low Priority" },
    medium: { bg: "bg-yellow-500", text: "text-yellow-500", label: "Medium Priority" },
    high: { bg: "bg-orange-500", text: "text-orange-500", label: "High Priority" },
    urgent: { bg: "bg-red-500", text: "text-red-500", label: "Urgent" },
  }

  const statusConfig = {
    pending: { bg: "bg-blue-500/20", text: "text-blue-500", label: "Pending" },
    "in-progress": { bg: "bg-purple-500/20", text: "text-purple-500", label: "In Progress" },
    completed: { bg: "bg-green-500/20", text: "text-green-500", label: "Completed" },
  }

  const priority = priorityConfig[selectedEvent.priority]
  const status = statusConfig[selectedEvent.status]
  const categoryColor = selectedEvent.category?.color || '#3b82f6'

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="sm:max-w-[480px] p-0 overflow-hidden border-0 shadow-2xl">
        {/* Header with gradient background */}
        <div
          className="relative p-6 pb-8"
          style={{
            background: `linear-gradient(135deg, ${categoryColor}20 0%, ${categoryColor}05 100%)`,
            borderBottom: `3px solid ${categoryColor}`
          }}
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 h-8 w-8 rounded-full bg-background/80 hover:bg-background"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>

          <DialogHeader className="pr-8">
            <div className="flex items-center gap-2 mb-2">
              {selectedEvent.category && (
                <Badge
                  className="border-0 font-medium"
                  style={{
                    backgroundColor: categoryColor,
                    color: 'white'
                  }}
                >
                  {selectedEvent.category.name}
                </Badge>
              )}
              <Badge className={`${priority.bg} text-white border-0`}>
                {priority.label}
              </Badge>
            </div>
            <DialogTitle className="text-2xl font-bold leading-tight">
              {selectedEvent.title}
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-5">
          {selectedEvent.description && (
            <p className="text-muted-foreground leading-relaxed">
              {selectedEvent.description}
            </p>
          )}

          {/* Event Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            {selectedEvent.due_date && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-sm font-medium">{format(new Date(selectedEvent.due_date), "MMM d, yyyy")}</p>
                </div>
              </div>
            )}

            {selectedEvent.due_time && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Time</p>
                  <p className="text-sm font-medium">{selectedEvent.due_time}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className={`h-10 w-10 rounded-full ${status.bg} flex items-center justify-center`}>
                <CheckCircle2 className={`h-5 w-5 ${status.text}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className={`text-sm font-medium ${status.text}`}>{status.label}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className={`h-10 w-10 rounded-full ${priority.bg}/20 flex items-center justify-center`}>
                <Flag className={`h-5 w-5 ${priority.text}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Priority</p>
                <p className={`text-sm font-medium capitalize ${priority.text}`}>{selectedEvent.priority}</p>
              </div>
            </div>
          </div>

          {selectedEvent.is_recurring && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 text-blue-600">
              <Repeat className="h-4 w-4" />
              <span className="text-sm font-medium">Recurring Task</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button className="flex-1" style={{ backgroundColor: categoryColor }}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Event
            </Button>
            <Button variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
