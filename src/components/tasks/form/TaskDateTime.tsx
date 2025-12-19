import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { TimePicker } from "@/components/ui/time-picker"
import { Calendar } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface TaskDateTimeProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  startTime: string
  setStartTime: (time: string) => void
  endTime: string
  setEndTime: (time: string) => void
}

export function TaskDateTime({ 
  date, 
  setDate, 
  startTime, 
  setStartTime, 
  endTime, 
  setEndTime 
}: TaskDateTimeProps) {
  return (
    <>
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
    </>
  )
}
