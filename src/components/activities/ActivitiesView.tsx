"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus, Calendar, CheckSquare } from "lucide-react"
import { format, isToday, isYesterday, isTomorrow, startOfDay } from "date-fns"

import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

import { ActivityListItem } from "./ActivityListItem"
import { ActivityDetailPanel } from "./ActivityDetailPanel"
import { CreateActivityButton } from "./CreateActivityButton"
import { ActivityWithParticipants, CalendarActivity } from "@/types/database"

type ActivityData = CalendarActivity | ActivityWithParticipants

interface Category {
  id: string
  name: string
  color: string | null
}

interface ActivitiesViewProps {
  activities: ActivityData[]
  categories: Category[]
  currentView: string
  currentType: string
  currentStatus: string
  currentCategory: string
  counts: {
    all: number
    task: number
    event: number
  }
}

// Helper to get unique key for activity
function getActivityKey(activity: ActivityData, index: number): string {
  if ('activityId' in activity && activity.activityId) {
    const occurrenceAt = 'occurrenceAt' in activity ? activity.occurrenceAt : null
    if (occurrenceAt) {
      const date = occurrenceAt instanceof Date ? occurrenceAt : new Date(occurrenceAt)
      return `${activity.activityId}-${date.getTime()}`
    }
    return `${activity.activityId}-${index}`
  }
  return activity.id
}

// Helper to get the relevant date from activity for sorting/grouping
function getActivityDate(activity: ActivityData): Date {
  // Check for occurrenceAt (for recurring instances) - this is the key for recurring!
  if ('occurrenceAt' in activity && activity.occurrenceAt) {
    return activity.occurrenceAt instanceof Date 
      ? activity.occurrenceAt 
      : new Date(activity.occurrenceAt)
  }
  
  // Check for startAt (camelCase - CalendarActivity)
  if ('startAt' in activity && activity.startAt) {
    return activity.startAt instanceof Date 
      ? activity.startAt 
      : new Date(activity.startAt)
  }
  
  // Check for start_at (snake_case - ActivityWithParticipants)
  if ('start_at' in activity && activity.start_at) {
    return new Date(activity.start_at)
  }
  
  // Check for dueAt (camelCase)
  if ('dueAt' in activity && activity.dueAt) {
    return activity.dueAt instanceof Date 
      ? activity.dueAt 
      : new Date(activity.dueAt)
  }
  
  // Check for due_at (snake_case)
  if ('due_at' in activity && activity.due_at) {
    return new Date(activity.due_at)
  }
  
  // Fallback to created_at or current date
  if ('created_at' in activity && activity.created_at) {
    return new Date(activity.created_at)
  }
  
  return new Date()
}

// Format date header - always show full date
function formatDateHeader(date: Date): string {
  const dayName = format(date, "EEEE")
  const dateStr = format(date, "d MMMM yyyy")
  
  if (isToday(date)) {
    return `Today • ${dayName}, ${dateStr}`
  }
  if (isYesterday(date)) {
    return `Yesterday • ${dayName}, ${dateStr}`
  }
  if (isTomorrow(date)) {
    return `Tomorrow • ${dayName}, ${dateStr}`
  }
  
  // Always show full date with day name
  return `${dayName}, ${dateStr}`
}

// Group activities by date
interface GroupedActivities {
  date: Date
  dateKey: string
  dateLabel: string
  activities: ActivityData[]
  isToday: boolean
  isFuture: boolean
}

function groupActivitiesByDate(activities: ActivityData[]): GroupedActivities[] {
  const today = startOfDay(new Date())
  
  // Group by date first
  const groups: Map<string, GroupedActivities> = new Map()
  
  for (const activity of activities) {
    const date = getActivityDate(activity)
    const dateKey = format(date, "yyyy-MM-dd")
    const activityDay = startOfDay(date)
    
    if (!groups.has(dateKey)) {
      groups.set(dateKey, {
        date: activityDay,
        dateKey,
        dateLabel: formatDateHeader(date),
        activities: [],
        isToday: isToday(date),
        isFuture: activityDay.getTime() > today.getTime()
      })
    }
    
    groups.get(dateKey)!.activities.push(activity)
  }
  
  // Sort activities within each group by time
  groups.forEach(group => {
    group.activities.sort((a, b) => {
      const dateA = getActivityDate(a)
      const dateB = getActivityDate(b)
      return dateA.getTime() - dateB.getTime()
    })
  })
  
  // Convert to array and sort:
  // Future dates: descending (furthest future at top)
  // Past dates: descending (most recent past after future)
  // Result: Scroll UP to see future, scroll DOWN to see past
  const groupsArray = Array.from(groups.values())
  
  // Sort by date descending (future at top, past at bottom)
  return groupsArray.sort((a, b) => b.date.getTime() - a.date.getTime())
}

export function ActivitiesView({
  activities,
  categories,
  currentType,
  counts,
}: ActivitiesViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedActivity, setSelectedActivity] = useState<ActivityData | null>(null)
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [eventDialogOpen, setEventDialogOpen] = useState(false)
  
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const todayRef = useRef<HTMLDivElement>(null)
  const prevTypeRef = useRef<string>(currentType)

  // Group activities by date
  const groupedActivities = useMemo(() => 
    groupActivitiesByDate(activities), 
    [activities]
  )
  
  // Find today's group index for checking if today has activities
  const todayGroup = useMemo(() => 
    groupedActivities.find(g => g.isToday),
    [groupedActivities]
  )
  
  // Find the index where today should be (for inserting "No Activity Today" card)
  const todayPosition = useMemo(() => {
    const today = startOfDay(new Date())
    // Since sorted descending, find first group that is today or past
    const idx = groupedActivities.findIndex(g => g.date.getTime() <= today.getTime())
    return idx === -1 ? groupedActivities.length : idx
  }, [groupedActivities])

  // Scroll to today on mount AND when tab changes
  useEffect(() => {
    // Check if type filter changed
    const typeChanged = prevTypeRef.current !== currentType
    prevTypeRef.current = currentType
    
    if (todayRef.current) {
      // Small delay to ensure layout is complete
      setTimeout(() => {
        todayRef.current?.scrollIntoView({ 
          behavior: typeChanged ? 'instant' : 'instant', 
          block: 'center' 
        })
      }, 100)
    }
  }, [groupedActivities, currentType])

  // Auto-select first activity on desktop
  useEffect(() => {
    if (activities.length > 0 && !selectedActivity) {
      if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
        // Prefer today's first activity, or first activity overall
        if (todayGroup && todayGroup.activities.length > 0) {
          setSelectedActivity(todayGroup.activities[0])
        } else if (groupedActivities.length > 0 && groupedActivities[0].activities.length > 0) {
          setSelectedActivity(groupedActivities[0].activities[0])
        }
      }
    }
  }, [activities, groupedActivities, todayGroup])

  // Update selected activity when activities change (e.g., after delete)
  useEffect(() => {
    if (selectedActivity) {
      const stillExists = activities.some(a => {
        const selectedKey = getActivityKey(selectedActivity, 0)
        const currentKey = getActivityKey(a, 0)
        return selectedKey === currentKey
      })
      if (!stillExists) {
        if (todayGroup && todayGroup.activities.length > 0) {
          setSelectedActivity(todayGroup.activities[0])
        } else if (groupedActivities.length > 0 && groupedActivities[0].activities.length > 0) {
          setSelectedActivity(groupedActivities[0].activities[0])
        } else {
          setSelectedActivity(null)
        }
      }
    }
  }, [activities, groupedActivities, todayGroup, selectedActivity])

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "all") {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`/activities?${params.toString()}`)
  }

  // Use counts from props (calculated before type filter) for consistent badge numbers
  const { all: allCount, task: taskCount, event: eventCount } = counts

  const handleSelectActivity = (activity: ActivityData) => {
    setSelectedActivity(activity)
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileDetailOpen(true)
    }
  }

  // Render "No Activity Today" card
  const renderNoActivityToday = () => (
    <div 
      ref={todayRef}
      className="space-y-2"
    >
      {/* Today Header */}
      <div className="flex justify-center sticky top-0 z-10 py-2">
        <div className="px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 shadow-sm">
          <span className="text-xs font-semibold text-primary">
            {formatDateHeader(new Date())}
          </span>
        </div>
      </div>
      
      {/* No Activity Card */}
      <div className="mx-1 p-6 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <Calendar className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-sm">No activities today</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Create a new task or event for today
          </p>
          <div className="flex gap-2">
            <CreateActivityButton
              variant="outline"
              className="gap-1.5 h-8 text-xs"
              defaultType="TASK"
              defaultDate={new Date()}
              directOpen
              open={taskDialogOpen}
              onOpenChange={setTaskDialogOpen}
            >
              <CheckSquare className="h-3.5 w-3.5" />
              Task
            </CreateActivityButton>
            <CreateActivityButton
              variant="outline"
              className="gap-1.5 h-8 text-xs"
              defaultType="EVENT"
              defaultDate={new Date()}
              directOpen
              open={eventDialogOpen}
              onOpenChange={setEventDialogOpen}
            >
              <Calendar className="h-3.5 w-3.5" />
              Event
            </CreateActivityButton>
          </div>
        </div>
      </div>
    </div>
  )

  // Build the list with today insertion point
  const renderActivityGroups = () => {
    const elements: React.ReactNode[] = []
    let todayInserted = false
    
    for (let i = 0; i < groupedActivities.length; i++) {
      const group = groupedActivities[i]
      
      // Check if we need to insert "No Activity Today" before this group
      // Since sorted descending: future groups come first, then today, then past
      // Insert "No Activity Today" when:
      // - We haven't inserted it yet
      // - There's no today group
      // - Current group is past (not future and not today)
      if (!todayInserted && !todayGroup && !group.isFuture && !group.isToday) {
        elements.push(
          <div key="no-activity-today">
            {renderNoActivityToday()}
          </div>
        )
        todayInserted = true
      }
      
      elements.push(
        <div 
          key={group.dateKey} 
          ref={group.isToday ? todayRef : undefined}
          className="space-y-2"
        >
          {/* Date Header */}
          <div className="flex justify-center sticky top-0 z-10 py-2">
            <div className={cn(
              "px-4 py-1.5 rounded-full border shadow-sm backdrop-blur-sm",
              group.isToday 
                ? "bg-primary/10 border-primary/20" 
                : "bg-muted/80"
            )}>
              <span className={cn(
                "text-xs font-medium",
                group.isToday 
                  ? "font-semibold text-primary" 
                  : "text-muted-foreground"
              )}>
                {group.dateLabel}
              </span>
            </div>
          </div>
          
          {/* Activities for this date */}
          <div className="space-y-2">
            {group.activities.map((activity, index) => {
              const key = getActivityKey(activity, index)
              const selectedKey = selectedActivity ? getActivityKey(selectedActivity, 0) : null
              const isSelected = key === selectedKey
              
              return (
                <ActivityListItem
                  key={key}
                  activity={activity}
                  isSelected={isSelected}
                  onClick={() => handleSelectActivity(activity)}
                />
              )
            })}
          </div>
        </div>
      )
    }
    
    // If no groups at all or all groups are in the future, add "No Activity Today" at the end
    if (!todayInserted && !todayGroup) {
      elements.push(
        <div key="no-activity-today">
          {renderNoActivityToday()}
        </div>
      )
    }
    
    return elements
  }

  return (
    <div className="h-full flex gap-4 overflow-hidden">
      {/* Left Panel - Activity List */}
      <div className="w-full lg:w-[400px] xl:w-[450px] flex flex-col bg-background overflow-hidden">
        {/* Type Tabs */}
        <div className="px-3 py-3 shrink-0">
          <Tabs value={currentType} onValueChange={(v) => updateFilter("type", v)}>
            <TabsList className="w-full h-10 bg-muted/50 p-1 rounded-lg gap-1">
              <TabsTrigger 
                value="all" 
                className="flex-1 rounded-md h-full text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground"
              >
                All
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px] font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                  {allCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="TASK"
                className="flex-1 rounded-md h-full text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground"
              >
                Tasks
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px] font-semibold">
                  {taskCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="EVENT"
                className="flex-1 rounded-md h-full text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground"
              >
                Events
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px] font-semibold">
                  {eventCount}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Activity List - Scrollable with Date Groups */}
        <div className="flex-1 min-h-0 overflow-hidden" ref={scrollAreaRef}>
          <ScrollArea className="h-full">
            {activities.length > 0 || !todayGroup ? (
              <div className="p-3 space-y-4">
                {renderActivityGroups()}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium">No activities yet</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Create your first activity to get started
                </p>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Right Panel - Activity Detail (Desktop) */}
      <div className="hidden lg:flex flex-1 min-w-0 overflow-hidden">
        <ActivityDetailPanel
          activity={selectedActivity}
          onClose={() => setSelectedActivity(null)}
        />
      </div>

      {/* Mobile Detail Sheet */}
      <Sheet open={mobileDetailOpen} onOpenChange={setMobileDetailOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0">
          <ActivityDetailPanel
            activity={selectedActivity}
            onClose={() => setMobileDetailOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}
