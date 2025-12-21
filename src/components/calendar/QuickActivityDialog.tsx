"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ActivityForm } from "@/components/activities/ActivityForm"
import { ActivityType } from "@/lib/validations/activities"
import { format } from "date-fns"

interface QuickActivityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: Date | null
  defaultType?: "event" | "task"
}

export function QuickActivityDialog({ 
  open, 
  onOpenChange, 
  selectedDate,
  defaultType = "task"
}: QuickActivityDialogProps) {
  const [activeTab, setActiveTab] = useState(defaultType)
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false)
  const router = useRouter()

  const handleSuccess = () => {
    onOpenChange(false)
    router.refresh() // Refresh to get updated activities
  }

  const handleClose = () => {
    if (!isColorPickerOpen) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-[500px] p-0 gap-0 overflow-hidden"
        showCloseButton={false}
        onInteractOutside={(e) => {
          if (isColorPickerOpen) e.preventDefault()
        }}
      >
        {/* Header with date and close button */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b">
          <div>
            <DialogTitle className="text-lg font-semibold">Create New</DialogTitle>
            {selectedDate && (
              <p className="text-sm text-muted-foreground">
                {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs for Event/Task */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "event" | "task")} className="w-full">
          <div className="px-6 pt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="event">Event</TabsTrigger>
              <TabsTrigger value="task">Task</TabsTrigger>
            </TabsList>
          </div>

          <div className="px-6 pb-6 max-h-[calc(85vh-180px)] overflow-y-auto">
            <TabsContent value="event" className="mt-4">
              <ActivityForm 
                onSuccess={handleSuccess}
                defaultType={ActivityType.EVENT}
                defaultDate={selectedDate || undefined}
                hideCalendarPicker={true}
                onColorPickerOpenChange={setIsColorPickerOpen}
              />
            </TabsContent>
            <TabsContent value="task" className="mt-4">
              <ActivityForm 
                onSuccess={handleSuccess}
                defaultType={ActivityType.TASK}
                defaultDate={selectedDate || undefined}
                hideCalendarPicker={true}
                onColorPickerOpenChange={setIsColorPickerOpen}
              />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
