"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import { TaskBasicInfo } from "./form/TaskBasicInfo"
import { TaskDateTime } from "./form/TaskDateTime"
import { TaskMetadata } from "./form/TaskMetadata"
import { TaskRecurrence } from "./form/TaskRecurrence"

interface TaskFormProps {
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  initialDate?: Date
  initialStartTime?: string
}

export function TaskForm({ children, open, onOpenChange, initialDate, initialStartTime }: TaskFormProps) {
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceType, setRecurrenceType] = useState<string>("daily")
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [date, setDate] = useState<Date | undefined>(initialDate)
  const [startTime, setStartTime] = useState<string>(initialStartTime || "")
  const [endTime, setEndTime] = useState<string>("")

  // Update date and time when initial props change
  useEffect(() => {
    if (open) {
      if (initialDate) setDate(initialDate)
      if (initialStartTime) setStartTime(initialStartTime)
      else if (!initialStartTime) setStartTime("") // Reset if opening fresh?
    }
  }, [initialDate, initialStartTime, open])

  const toggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && (
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[520px] glass max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new task to your list. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          <TaskBasicInfo />
          
          <TaskDateTime 
            date={date}
            setDate={setDate}
            startTime={startTime}
            setStartTime={setStartTime}
            endTime={endTime}
            setEndTime={setEndTime}
          />

          <TaskMetadata />

          <TaskRecurrence 
            isRecurring={isRecurring}
            setIsRecurring={setIsRecurring}
            recurrenceType={recurrenceType}
            setRecurrenceType={setRecurrenceType}
            selectedDays={selectedDays}
            toggleDay={toggleDay}
          />
        </div>

        <DialogFooter className="gap-4 sm:gap-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>
            Cancel
          </Button>
          <Button type="submit" className="bg-primary hover:bg-primary/90">
            Save Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
