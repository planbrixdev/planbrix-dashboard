import { createClient } from "@/lib/supabase/server"
import { getActivities } from "@/services/activities"
import { DashboardView } from "@/components/dashboard/DashboardView"
import { redirect } from "next/navigation"
import { isSameDay, isAfter, isBefore, startOfDay } from "date-fns"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth")

  const activities = await getActivities(user.id)

  const today = new Date()
  const todayActivities = activities.filter(a => {
    const date = a.start_at ? new Date(a.start_at) : a.due_at ? new Date(a.due_at) : null
    return date && isSameDay(date, today)
  })

  const upcomingActivities = activities.filter(a => {
    const date = a.start_at ? new Date(a.start_at) : a.due_at ? new Date(a.due_at) : null
    return date && isAfter(date, today)
  }).slice(0, 5)

  const stats = {
    total: activities.length,
    completed: activities.filter(a => a.status === "DONE").length,
    pending: activities.filter(a => a.status === "TODO" || a.status === "IN_PROGRESS").length,
    overdue: activities.filter(a => {
      const date = a.due_at ? new Date(a.due_at) : null
      return date && isBefore(date, startOfDay(today)) && a.status !== "DONE"
    }).length
  }

  return (
    <DashboardView 
      todayActivities={todayActivities}
      upcomingActivities={upcomingActivities}
      stats={stats}
    />
  )
}
