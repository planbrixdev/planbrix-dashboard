"use client"

import { useState, useTransition, useEffect } from "react"
import { useForm, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2, Flag, Tag, Clock, Plus } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { Category } from "@/services/categories"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { RecurrencePicker } from "@/components/ui/recurrence-picker"
import { TimePicker } from "@/components/ui/time-picker"
import { InlineCategoryForm, PendingCategory, AddCategoryButton } from "./InlineCategoryForm"

import {
  createActivitySchema,
  CreateActivityInput,
  ActivityType,
  ActivityPriority,
  ActivityStatus,
} from "@/lib/validations/activities"
import { createActivity } from "@/actions/activities"

type ActivityTypeEnum = typeof ActivityType[keyof typeof ActivityType]

interface ActivityFormProps {
  onSuccess?: () => void
  defaultType?: ActivityTypeEnum
  onColorPickerOpenChange?: (isOpen: boolean) => void
  defaultDate?: Date
  hideCalendarPicker?: boolean
}

export function ActivityForm({ onSuccess, defaultType, onColorPickerOpenChange, defaultDate, hideCalendarPicker = false }: ActivityFormProps) {
  const [isPending, startTransition] = useTransition()
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCalendar, setActiveCalendar] = useState<"due" | "start" | "end" | null>(null)
  const [pendingCategory, setPendingCategory] = useState<PendingCategory | null>(null)
  const [showInlineCategoryForm, setShowInlineCategoryForm] = useState(false)
  const [categorySelectOpen, setCategorySelectOpen] = useState(false)
  const [isColorPickerActive, setIsColorPickerActive] = useState(false)

  useEffect(() => {
    const fetchCategories = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("categories")
        .select("*")
        .is("deleted_at", null)
        .order("name")
      
      if (data) {
        setCategories(data)
      }
    }
    fetchCategories()
  }, [])
  
  const form = useForm<CreateActivityInput>({
    resolver: zodResolver(createActivitySchema) as any,
    defaultValues: {
      title: "",
      description: "",
      type: defaultType || ActivityType.TASK,
      status: ActivityStatus.TODO,
      priority: ActivityPriority.MEDIUM,
      is_recurring: false,
      is_all_day: false,
      due_at: defaultDate ? defaultDate.toISOString() : undefined,
      start_at: defaultDate ? defaultDate.toISOString() : undefined,
    },
  })

  const type = form.watch("type")
  const isRecurring = form.watch("is_recurring")
  const isAllDay = form.watch("is_all_day")
  const startAt = form.watch("start_at")
  const dueAt = form.watch("due_at")

  const setTime = (dateStr: string | null | undefined, timeStr: string) => {
    const date = dateStr ? new Date(dateStr) : new Date();
    const [hours, minutes] = timeStr.split(':').map(Number);
    date.setHours(hours);
    date.setMinutes(minutes);
    return date.toISOString();
  }

  const onSubmit: SubmitHandler<CreateActivityInput> = (data) => {
    startTransition(async () => {
      // If there's a pending category, send it along with the activity
      // Remove the temp category_id as it's not a valid UUID
      const activityData = pendingCategory
        ? { ...data, category_id: null }
        : data

      const result = pendingCategory
        ? await createActivity({
            activity: activityData,
            pendingCategory: {
              name: pendingCategory.name,
              color: pendingCategory.color,
            },
          })
        : await createActivity(data)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Activity created successfully")
        form.reset()
        setPendingCategory(null)
        onSuccess?.()
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="min-h-full flex flex-col">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input 
                    placeholder="Add title" 
                    {...field} 
                    className="text-xl font-semibold border-0 border-b border-input rounded-none px-0 shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/50 h-auto py-2"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-wrap gap-2">
            {!defaultType && (
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger className="h-8 w-auto gap-2 rounded-full bg-muted/50 border-0 px-3 text-xs font-medium hover:bg-muted focus:ring-0 focus:ring-offset-0">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={ActivityType.TASK}>Task</SelectItem>
                        <SelectItem value={ActivityType.EVENT}>Event</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem className="space-y-0">
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger className={cn(
                        "h-8 w-auto gap-2 rounded-full border-0 px-3 text-xs font-medium hover:bg-muted focus:ring-0 focus:ring-offset-0",
                        field.value === ActivityPriority.URGENT ? "bg-red-100 text-red-700 hover:bg-red-200" :
                        field.value === ActivityPriority.HIGH ? "bg-orange-100 text-orange-700 hover:bg-orange-200" :
                        field.value === ActivityPriority.MEDIUM ? "bg-blue-100 text-blue-700 hover:bg-blue-200" :
                        "bg-muted/50"
                      )}>
                        <Flag className="h-3.5 w-3.5" />
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={ActivityPriority.LOW}>Low</SelectItem>
                      <SelectItem value={ActivityPriority.MEDIUM}>Medium</SelectItem>
                      <SelectItem value={ActivityPriority.HIGH}>High</SelectItem>
                      <SelectItem value={ActivityPriority.URGENT}>Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem className="space-y-0">
                  <Popover open={categorySelectOpen} onOpenChange={(open) => {
                    // Prevent closing when color picker is active
                    if (!open && isColorPickerActive) return
                    setCategorySelectOpen(open)
                    if (!open) setShowInlineCategoryForm(false)
                  }}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="ghost"
                          role="combobox"
                          className={cn(
                            "h-8 w-auto gap-2 rounded-full bg-muted/50 border-0 px-3 text-xs font-medium hover:bg-muted focus:ring-0 focus:ring-offset-0",
                            pendingCategory && "bg-primary/10 text-primary"
                          )}
                        >
                          {pendingCategory ? (
                            <>
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: pendingCategory.color }}
                              />
                              <span>{pendingCategory.name}</span>
                              <span className="text-[10px] bg-primary/20 px-1.5 py-0.5 rounded-full">New</span>
                            </>
                          ) : (
                            <>
                              <Tag className="h-3.5 w-3.5" />
                              {field.value && field.value !== "_none" ? (
                                <>
                                  <span
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: categories.find(c => c.id === field.value)?.color || "#gray" }}
                                  />
                                  {categories.find(c => c.id === field.value)?.name}
                                </>
                              ) : (
                                "No Category"
                              )}
                            </>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[220px] p-0" align="start">
                      {showInlineCategoryForm ? (
                        <InlineCategoryForm
                          onAdd={(cat) => {
                            setPendingCategory(cat)
                            // Don't set tempId to field - it's not a valid UUID
                            // Just clear the existing category_id since we'll use pending category
                            field.onChange(null)
                            setShowInlineCategoryForm(false)
                            setCategorySelectOpen(false)
                          }}
                          onCancel={() => setShowInlineCategoryForm(false)}
                          onColorPickerOpenChange={(isOpen) => {
                            setIsColorPickerActive(isOpen)
                            onColorPickerOpenChange?.(isOpen)
                          }}
                        />
                      ) : (
                        <div className="py-1">
                          <button
                            type="button"
                            onClick={() => {
                              field.onChange(null)
                              setPendingCategory(null)
                              setCategorySelectOpen(false)
                            }}
                            className={cn(
                              "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-3 pr-2 text-sm outline-none hover:bg-accent focus:bg-accent",
                              !field.value && !pendingCategory && "bg-accent"
                            )}
                          >
                            No Category
                          </button>
                          {categories.map((category) => (
                            <button
                              key={category.id}
                              type="button"
                              onClick={() => {
                                field.onChange(category.id)
                                setPendingCategory(null)
                                setCategorySelectOpen(false)
                              }}
                              className={cn(
                                "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-3 pr-2 text-sm outline-none hover:bg-accent focus:bg-accent gap-2",
                                field.value === category.id && !pendingCategory && "bg-accent"
                              )}
                            >
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: category.color || "#gray" }}
                              />
                              {category.name || "Unnamed Category"}
                            </button>
                          ))}
                          <div className="border-t my-1" />
                          <AddCategoryButton onClick={() => setShowInlineCategoryForm(true)} />
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </FormItem>
              )}
            />
          </div>

          {type === ActivityType.TASK && (
            <FormField
              control={form.control}
              name="due_at"
              render={({ field }) => (
                <FormItem className="flex flex-col space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Clock className="h-4 w-4" />
                    <span>Due Date</span>
                  </div>
                  <div className="flex gap-2">
                    {!hideCalendarPicker && (
                      <Popover open={activeCalendar === "due"} onOpenChange={(open) => setActiveCalendar(open ? "due" : null)}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "flex-1 pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(new Date(field.value), "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                const current = field.value ? new Date(field.value) : new Date()
                                date.setHours(current.getHours())
                                date.setMinutes(current.getMinutes())
                                field.onChange(date.toISOString())
                                setActiveCalendar(null)
                              } else {
                                field.onChange(null)
                              }
                            }}
                            disabled={(date) =>
                              date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                    {hideCalendarPicker && field.value && (
                      <div className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted">
                        {format(new Date(field.value), "PPP")}
                      </div>
                    )}
                    <TimePicker
                      className="w-[140px]"
                      value={field.value ? format(new Date(field.value), "HH:mm") : "09:00"}
                      onChange={(time) => field.onChange(setTime(field.value, time))}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {type === ActivityType.EVENT && (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="is_all_day"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">All Day</FormLabel>
                  </FormItem>
                )}
              />
              
              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="start_at"
                  render={({ field }) => (
                    <FormItem className="flex flex-col space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Clock className="h-4 w-4" />
                        <span>Start</span>
                      </div>
                      <div className="flex gap-2">
                        {!hideCalendarPicker && (
                          <Popover open={activeCalendar === "start"} onOpenChange={(open) => setActiveCalendar(open ? "start" : null)}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "flex-1 pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(new Date(field.value), "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value ? new Date(field.value) : undefined}
                                onSelect={(date) => {
                                  if (date) {
                                    const current = field.value ? new Date(field.value) : new Date()
                                    date.setHours(current.getHours())
                                    date.setMinutes(current.getMinutes())
                                    field.onChange(date.toISOString())
                                    setActiveCalendar(null)
                                  } else {
                                    field.onChange(null)
                                  }
                                }}
                                disabled={(date) =>
                                  date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        )}
                        {hideCalendarPicker && field.value && (
                          <div className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted">
                            {format(new Date(field.value), "PPP")}
                          </div>
                        )}
                    {!isAllDay && (
                      <TimePicker
                        className="w-[140px]"
                        value={field.value ? format(new Date(field.value), "HH:mm") : "09:00"}
                        onChange={(time) => field.onChange(setTime(field.value, time))}
                      />
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

                <FormField
                  control={form.control}
                  name="end_at"
                  render={({ field }) => (
                    <FormItem className="flex flex-col space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Clock className="h-4 w-4" />
                        <span>End</span>
                      </div>
                      <div className="flex gap-2">
                        {!hideCalendarPicker && (
                          <Popover open={activeCalendar === "end"} onOpenChange={(open) => setActiveCalendar(open ? "end" : null)}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "flex-1 pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(new Date(field.value), "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value ? new Date(field.value) : undefined}
                                onSelect={(date) => {
                                  if (date) {
                                    const current = field.value ? new Date(field.value) : new Date()
                                    date.setHours(current.getHours())
                                    date.setMinutes(current.getMinutes())
                                    field.onChange(date.toISOString())
                                    setActiveCalendar(null)
                                  } else {
                                    field.onChange(null)
                                  }
                                }}
                                disabled={(date) =>
                                  date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        )}
                        {hideCalendarPicker && field.value && (
                          <div className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted">
                            {format(new Date(field.value), "PPP")}
                          </div>
                        )}
                    {!isAllDay && (
                      <TimePicker
                        className="w-[140px]"
                        value={field.value ? format(new Date(field.value), "HH:mm") : "10:00"}
                        onChange={(time) => field.onChange(setTime(field.value, time))}
                      />
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
              </div>
            </div>
          )}

          <FormField
            control={form.control}
            name="recurrence_rule"
            render={({ field }) => (
              <FormItem className="flex flex-col space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <span className="text-xs font-medium uppercase tracking-wider">Repeat</span>
                </div>
                <FormControl>
                  <RecurrencePicker 
                    value={field.value} 
                    onChange={(val) => {
                      field.onChange(val)
                      form.setValue("is_recurring", !!val)
                    }}
                    startDate={
                      type === ActivityType.EVENT 
                        ? (startAt ? new Date(startAt) : new Date()) 
                        : (dueAt ? new Date(dueAt) : new Date())
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder="Add description..."
                    className="resize-none min-h-[2.5rem] border-0 border-b border-input rounded-none px-0 shadow-none focus-visible:ring-0 overflow-hidden"
                    rows={1}
                    {...field}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = "auto";
                      target.style.height = `${target.scrollHeight}px`;
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex-1 min-h-6"></div>

        <div className="pt-6 shrink-0">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Activity
          </Button>
        </div>
      </form>
    </Form>
  )
}
