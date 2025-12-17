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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Clock, Calendar } from "lucide-react"
import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { TimePicker } from "@/components/ui/time-picker"

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

  // ... (daysOfWeek const and toggleDay func remain same, skipping to save tokens if possible, but replace_file_content needs contiguous block)

  const daysOfWeek = [
    { value: "mon", label: "Sen" },
    { value: "tue", label: "Sel" },
    { value: "wed", label: "Rab" },
    { value: "thu", label: "Kam" },
    { value: "fri", label: "Jum" },
    { value: "sat", label: "Sab" },
    { value: "sun", label: "Min" },
  ]

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
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">Title</Label>
            <Input
              id="title"
              placeholder="e.g., Review Q3 Marketing Plan"
              className="bg-background/50 h-10"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">Description</Label>
            <Textarea
              id="description"
              placeholder="Add details..."
              className="bg-background/50 min-h-[80px] resize-none"
            />
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-background/50 h-10",
                    !date && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Start Time & End Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="startTime" className="text-sm font-medium">Start Time</Label>
              <TimePicker
                value={startTime}
                onChange={setStartTime}
                className="h-10 bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime" className="text-sm font-medium">End Time</Label>
              <TimePicker
                value={endTime}
                onChange={setEndTime}
                className="h-10 bg-background/50"
              />
            </div>
          </div>

          {/* Status, Priority & Category - 3 columns */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <Select defaultValue="pending">
                <SelectTrigger className="bg-background/50 h-10">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      Pending
                    </div>
                  </SelectItem>
                  <SelectItem value="in-progress">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      In Progress
                    </div>
                  </SelectItem>
                  <SelectItem value="completed">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      Completed
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Priority</Label>
              <Select defaultValue="medium">
                <SelectTrigger className="bg-background/50 h-10">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      Low
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-yellow-500" />
                      Medium
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-orange-500" />
                      High
                    </div>
                  </SelectItem>
                  <SelectItem value="urgent">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      Urgent
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Category</Label>
              <Select>
                <SelectTrigger className="bg-background/50 h-10">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="work">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-violet-500" />
                      Work
                    </div>
                  </SelectItem>
                  <SelectItem value="personal">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      Personal
                    </div>
                  </SelectItem>
                  <SelectItem value="shopping">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Shopping
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Recurring Section */}
          <div className="space-y-3 border rounded-lg p-4 bg-background/30">
            <div className="flex items-center justify-between">
              <Label htmlFor="recurring" className="flex flex-col space-y-1 cursor-pointer">
                <span className="text-sm font-medium">Recurring Task</span>
                <span className="font-normal text-xs text-muted-foreground">Repeat this task regularly</span>
              </Label>
              <Switch id="recurring" checked={isRecurring} onCheckedChange={setIsRecurring} />
            </div>

            {isRecurring && (
              <div className="space-y-4 pt-3 border-t">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Repeat</Label>
                  <Select value={recurrenceType} onValueChange={setRecurrenceType}>
                    <SelectTrigger className="bg-background/50 h-10">
                      <SelectValue placeholder="Select recurrence" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="selected_days">Selected Days</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {recurrenceType === "selected_days" && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Select Days</Label>
                    <div className="flex flex-wrap gap-2">
                      {daysOfWeek.map((day) => (
                        <Button
                          key={day.value}
                          type="button"
                          variant={selectedDays.includes(day.value) ? "default" : "outline"}
                          size="sm"
                          className="h-9 w-11 p-0 text-xs font-medium"
                          onClick={() => toggleDay(day.value)}
                        >
                          {day.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
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
