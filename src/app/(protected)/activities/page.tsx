import { createClient } from "@/lib/supabase/server"
import { getActivities } from "@/services/activities"
import { ActivityCard } from "@/components/activities/ActivityCard"
import { CreateActivityButton } from "@/components/activities/CreateActivityButton"
import { Plus } from "lucide-react"
import { redirect } from "next/navigation"

export default async function ActivitiesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth")
  }

  const activities = await getActivities(user.id)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activities</h1>
          <p className="text-muted-foreground">
            Manage your tasks and events.
          </p>
        </div>
        <CreateActivityButton />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {activities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
        {activities.length === 0 && (
          <div className="col-span-full flex h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No activities yet</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              Create your first activity to get started.
            </p>
            <CreateActivityButton variant="outline">
              Create Activity
            </CreateActivityButton>
          </div>
        )}
      </div>
    </div>
  )
}
