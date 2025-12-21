import { createClient } from "@/lib/supabase/server"
import { getExpandedActivities } from "@/services/activities"
import { CalendarView } from "@/components/calendar/CalendarView"
import { redirect } from "next/navigation"
import { startOfMonth, endOfMonth, subMonths, addMonths } from "date-fns"

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth")

  // Get activities for a 3-month window (previous, current, next)
  const today = new Date()
  const dateRange = {
    start: startOfMonth(subMonths(today, 1)),
    end: endOfMonth(addMonths(today, 1))
  }

  const activities = await getExpandedActivities(user.id, dateRange)

  return (
    <div className="h-full">
      <CalendarView activities={activities} />
    </div>
  )
}
