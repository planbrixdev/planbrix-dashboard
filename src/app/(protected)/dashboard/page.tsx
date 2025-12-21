import { createClient } from "@/lib/supabase/server"
import { getExpandedActivities } from "@/services/activities"
import { DashboardView } from "@/components/dashboard/DashboardView"
import { redirect } from "next/navigation"
import { isSameDay, isAfter, isBefore, startOfDay, endOfDay, addDays } from "date-fns"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth")

  const today = new Date()
  
  // Get expanded activities for dashboard (today + upcoming 30 days)
  const dateRange = {
    start: startOfDay(today),
    end: endOfDay(addDays(today, 30))
  }
  
  const activities = await getExpandedActivities(user.id, dateRange)

  const todayActivities = activities.filter(a => {
    const date = a.startAt || a.dueAt || a.occurrenceAt
    return date && isSameDay(date instanceof Date ? date : new Date(date), today)
  })

  const upcomingActivities = activities.filter(a => {
    const date = a.startAt || a.dueAt || a.occurrenceAt
    return date && isAfter(date instanceof Date ? date : new Date(date), today)
  }).slice(0, 5)

  // For stats, count unique activity IDs (not instances)
  const uniqueActivityIds = new Set(activities.map(a => a.activityId))
  
  const stats = {
    total: uniqueActivityIds.size,
    completed: activities.filter(a => a.status === "DONE").length,
    pending: activities.filter(a => a.status === "TODO" || a.status === "IN_PROGRESS").length,
    overdue: activities.filter(a => {
      const date = a.dueAt || a.startAt
      return date && isBefore(date instanceof Date ? date : new Date(date), startOfDay(today)) && a.status !== "DONE"
    }).length
  }

  return (
    <DashboardView 
      todayActivities={todayActivities as any}
      upcomingActivities={upcomingActivities as any}
      stats={stats}
    />
  )
}
