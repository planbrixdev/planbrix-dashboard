import { createClient } from "@/lib/supabase/server"
import { getActivities, getExpandedActivities } from "@/services/activities"
import { ActivityCard } from "@/components/activities/ActivityCard"
import { CreateActivityButton } from "@/components/activities/CreateActivityButton"
import { Plus } from "lucide-react"
import { redirect } from "next/navigation"
import { startOfMonth, endOfMonth, addMonths } from "date-fns"
import { ActivitiesView } from "@/components/activities/ActivitiesView"

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth")
  }

  const params = await searchParams
  
  // Parse view mode - list shows raw activities, calendar shows expanded
  const viewMode = (params.view as string) || "all"
  const filterType = (params.type as string) || "all"
  const filterStatus = (params.status as string) || "all"
  const filterCategory = (params.category as string) || "all"
  
  // For expanded view, we need date range (default: current month + next month)
  const now = new Date()
  const rangeStart = startOfMonth(now)
  const rangeEnd = endOfMonth(addMonths(now, 2))

  // Get both raw activities and expanded activities
  const [rawActivities, expandedActivities] = await Promise.all([
    getActivities(user.id),
    getExpandedActivities(user.id, { start: rangeStart, end: rangeEnd })
  ])

  // Filter activities based on params
  // Use expanded activities by default to show recurring instances
  let displayActivities: (typeof rawActivities[number] | typeof expandedActivities[number])[] = 
    expandedActivities

  // Apply type filter
  if (filterType !== "all") {
    displayActivities = displayActivities.filter(a => a.type === filterType)
  }

  // Apply status filter  
  if (filterStatus !== "all") {
    displayActivities = displayActivities.filter(a => a.status === filterStatus)
  }

  // Apply category filter
  if (filterCategory !== "all") {
    displayActivities = displayActivities.filter(a => a.category?.id === filterCategory)
  }

  // Get unique categories for filter
  const categories = [...new Map(rawActivities
    .filter(a => a.category && a.category.name)
    .map(a => [a.category!.id, { 
      id: a.category!.id, 
      name: a.category!.name!, 
      color: a.category!.color 
    }])
  ).values()]

  // Calculate counts BEFORE type filter for consistent badge numbers
  const allCount = expandedActivities.length
  const taskCount = expandedActivities.filter(a => a.type === "TASK").length
  const eventCount = expandedActivities.filter(a => a.type === "EVENT").length

  return (
    <div className="h-full">
      <ActivitiesView 
        activities={displayActivities as any}
        categories={categories}
        currentView={viewMode}
        currentType={filterType}
        currentStatus={filterStatus}
        currentCategory={filterCategory}
        counts={{ all: allCount, task: taskCount, event: eventCount }}
      />
    </div>
  )
}
