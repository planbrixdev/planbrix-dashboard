"use client"

import * as React from "react"
import { RRule, Frequency } from "rrule"
import { format, getDay, getDate, getMonth } from "date-fns"
import { Check, ChevronDown, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface RecurrencePickerProps {
  value?: string | null
  onChange: (value: string | null) => void
  className?: string
  startDate?: Date
}

const FREQUENCIES = [
  { label: "Daily", value: Frequency.DAILY },
  { label: "Weekly", value: Frequency.WEEKLY },
  { label: "Monthly", value: Frequency.MONTHLY },
  { label: "Yearly", value: Frequency.YEARLY },
]

const WEEKDAYS = [
  { label: "Mo", value: RRule.MO },
  { label: "Tu", value: RRule.TU },
  { label: "We", value: RRule.WE },
  { label: "Th", value: RRule.TH },
  { label: "Fr", value: RRule.FR },
  { label: "Sa", value: RRule.SA },
  { label: "Su", value: RRule.SU },
]

const RRULE_WEEKDAYS = [
  RRule.SU, RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA
]

export function RecurrencePicker({ value, onChange, className, startDate = new Date() }: RecurrencePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isCustom, setIsCustom] = React.useState(false)
  
  // Generate templates based on startDate
  const templates = React.useMemo(() => {
    const dayOfWeek = RRULE_WEEKDAYS[getDay(startDate)]
    const dayOfMonth = getDate(startDate)
    const month = getMonth(startDate) + 1 // 1-12
    const weekNumber = Math.ceil(dayOfMonth / 7)
    
    // Helper to format RRule string
    const toRRule = (options: any) => new RRule(options).toString().replace(/^RRULE:/, "")

    return [
      { label: "Does not repeat", value: "" },
      { 
        label: "Daily", 
        value: "FREQ=DAILY" 
      },
      { 
        label: `Weekly on ${format(startDate, "EEEE")}`, 
        value: toRRule({ freq: Frequency.WEEKLY, byweekday: [dayOfWeek] })
      },
      { 
        label: `Monthly on the ${format(startDate, "do")}`, 
        value: toRRule({ freq: Frequency.MONTHLY, bymonthday: [dayOfMonth] })
      },
      { 
        label: `Monthly on the ${format(startDate, "do")} ${format(startDate, "EEEE")}`, // e.g. 3rd Friday
        // Note: RRule uses byweekday with nth occurrence for this. 
        // But rrule.js simple object API for byweekday is just [RRule.MO], not allowing position easily in simple object.
        // We construct it manually or use the object correctly.
        // RRule.MO.nth(1) is supported in newer versions or we use bysetpos?
        // Actually rrule.js supports `byweekday: [RRule.MO.nth(1)]`
        value: toRRule({ freq: Frequency.MONTHLY, byweekday: [dayOfWeek.nth(weekNumber)] })
      },
      { 
        label: `Annually on ${format(startDate, "MMMM do")}`, 
        value: toRRule({ freq: Frequency.YEARLY, bymonth: [month], bymonthday: [dayOfMonth] })
      },
      { 
        label: "Every weekday (Mon-Fri)", 
        value: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR" 
      },
    ]
  }, [startDate])

  // Parse existing rule or set defaults
  const rule = React.useMemo(() => {
    if (!value) return null
    try {
      return RRule.fromString(value)
    } catch {
      return null
    }
  }, [value])

  const [freq, setFreq] = React.useState<Frequency>(rule?.options.freq ?? Frequency.WEEKLY)
  const [interval, setInterval] = React.useState(rule?.options.interval ?? 1)
  const [byweekday, setByweekday] = React.useState<any[]>(rule?.options.byweekday ?? [])
  const [endType, setEndType] = React.useState<"never" | "count" | "until">(
    rule?.options.count ? "count" : rule?.options.until ? "until" : "never"
  )
  const [count, setCount] = React.useState(rule?.options.count ?? 10)
  const [until, setUntil] = React.useState<Date | undefined>(rule?.options.until ?? undefined)

  // Check if current value matches a template
  const activeTemplate = React.useMemo(() => {
    if (!value) return templates[0]
    // We need to normalize the strings for comparison because RRule.toString() might vary slightly
    // or just do exact match. RRule.toString() is deterministic usually.
    // However, "FREQ=DAILY" vs "FREQ=DAILY;INTERVAL=1" might differ.
    // Let's try exact match first.
    return templates.find(t => t.value === value)
  }, [value, templates])

  // Initialize custom mode if value exists but doesn't match a template
  React.useEffect(() => {
    if (value && !activeTemplate) {
      setIsCustom(true)
    }
  }, [value, activeTemplate])

  // Update rule string when state changes (only in custom mode)
  React.useEffect(() => {
    if (!isOpen || !isCustom) return 

    const options: any = {
      freq,
      interval,
    }

    if (freq === Frequency.WEEKLY && byweekday.length > 0) {
      options.byweekday = byweekday
    }

    if (endType === "count") {
      options.count = count
    } else if (endType === "until" && until) {
      options.until = until
    }

    try {
      const newRule = new RRule(options)
      onChange(newRule.toString())
    } catch (e) {
      // Invalid rule state
    }
  }, [freq, interval, byweekday, endType, count, until, isOpen, isCustom])

  const toggleWeekday = (day: any) => {
    const exists = byweekday.some(d => d.weekday === day.weekday)
    if (exists) {
      setByweekday(byweekday.filter(d => d.weekday !== day.weekday))
    } else {
      setByweekday([...byweekday, day])
    }
  }

  const humanReadable = React.useMemo(() => {
    if (!value) return "Does not repeat"
    
    // Check if it matches a template label first for nicer display
    const template = templates.find(t => t.value === value)
    if (template) return template.label

    try {
      const text = RRule.fromString(value).toText()
      return text
        .replace("Monday", "Mon")
        .replace("Tuesday", "Tue")
        .replace("Wednesday", "Wed")
        .replace("Thursday", "Thu")
        .replace("Friday", "Fri")
        .replace("Saturday", "Sat")
        .replace("Sunday", "Sun")
    } catch {
      return "Invalid rule"
    }
  }, [value, templates])

  const handleTemplateSelect = (templateValue: string) => {
    onChange(templateValue)
    setIsCustom(false)
    if (templateValue === "") {
        // Reset custom form state
        setFreq(Frequency.WEEKLY)
        setInterval(1)
        setByweekday([])
        setEndType("never")
    } else {
        // Try to populate custom form from template for smoother transition if they switch to custom later
        try {
            const r = RRule.fromString(templateValue)
            setFreq(r.options.freq)
            setInterval(r.options.interval)
            setByweekday(r.options.byweekday || [])
            setEndType("never")
        } catch {}
    }
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className={cn("w-full justify-between h-auto min-h-10 py-2 text-left whitespace-normal", className)}
        >
          <span className="flex-1">{humanReadable}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        {!isCustom ? (
          <Command>
            <CommandList>
              <CommandGroup>
                {templates.map((template) => (
                  <CommandItem
                    key={template.label}
                    onSelect={() => handleTemplateSelect(template.value)}
                    className="flex items-center justify-between"
                  >
                    {template.label}
                    {value === template.value && <Check className="h-4 w-4" />}
                  </CommandItem>
                ))}
                <CommandItem
                  onSelect={() => setIsCustom(true)}
                  className="flex items-center justify-between font-medium text-primary"
                >
                  Custom...
                  <ChevronRight className="h-4 w-4" />
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        ) : (
          <div className="p-4 grid gap-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium leading-none">Custom Recurrence</h4>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-auto p-0 text-muted-foreground hover:text-foreground"
                onClick={() => setIsCustom(false)}
              >
                Back to presets
              </Button>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium leading-none">Repeat every</h4>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  value={interval}
                  onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                  className="w-20"
                />
                <Select
                  value={freq.toString()}
                  onValueChange={(v) => setFreq(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((f) => (
                      <SelectItem key={f.value} value={f.value.toString()}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {freq === Frequency.WEEKLY && (
              <div className="space-y-2">
                <Label>Repeat on</Label>
                <div className="flex flex-wrap gap-1">
                  {WEEKDAYS.map((day) => {
                    const isSelected = byweekday.some(d => d.weekday === day.value.weekday)
                    return (
                      <Button
                        key={day.label}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className={cn("h-8 w-8 p-0", isSelected ? "bg-primary text-primary-foreground" : "")}
                        onClick={() => toggleWeekday(day.value)}
                      >
                        {day.label}
                      </Button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Ends</Label>
              <RadioGroup value={endType} onValueChange={(v: any) => setEndType(v)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="never" id="never" />
                  <Label htmlFor="never">Never</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="count" id="count" />
                  <Label htmlFor="count">After</Label>
                  <Input
                    type="number"
                    min={1}
                    value={count}
                    onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                    className="w-16 h-8"
                    disabled={endType !== "count"}
                  />
                  <span className="text-sm text-muted-foreground">occurrences</span>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="until" id="until" />
                  <Label htmlFor="until">On</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "w-[130px] justify-start text-left font-normal h-8",
                          !until && "text-muted-foreground"
                        )}
                        disabled={endType !== "until"}
                      >
                        {until ? format(until, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={until}
                        onSelect={setUntil}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </RadioGroup>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
