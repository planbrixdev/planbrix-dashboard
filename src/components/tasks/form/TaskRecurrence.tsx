import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TaskRecurrenceProps {
  isRecurring: boolean
  setIsRecurring: (val: boolean) => void
  recurrenceType: string
  setRecurrenceType: (val: string) => void
  selectedDays: string[]
  toggleDay: (day: string) => void
}

const DAYS_OF_WEEK = [
  { value: "mon", label: "Sen" },
  { value: "tue", label: "Sel" },
  { value: "wed", label: "Rab" },
  { value: "thu", label: "Kam" },
  { value: "fri", label: "Jum" },
  { value: "sat", label: "Sab" },
  { value: "sun", label: "Min" },
]

export function TaskRecurrence({
  isRecurring,
  setIsRecurring,
  recurrenceType,
  setRecurrenceType,
  selectedDays,
  toggleDay
}: TaskRecurrenceProps) {
  return (
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
                {DAYS_OF_WEEK.map((day) => (
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
  )
}
