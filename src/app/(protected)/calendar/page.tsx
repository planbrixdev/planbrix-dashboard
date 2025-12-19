import { createClient } from "@/lib/supabase/server"
import { getActivities } from "@/services/activities"
import { CalendarView } from "@/components/calendar/CalendarView"
import { redirect } from "next/navigation"

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth")

  const activities = await getActivities(user.id)

  return (
    <div className="p-6 h-full">
      <CalendarView activities={activities} />
    </div>
  )
}
