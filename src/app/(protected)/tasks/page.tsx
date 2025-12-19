import { createClient } from "@/lib/supabase/server"
import { getActivities } from "@/services/activities"
import { ActivityCard } from "@/components/activities/ActivityCard"
import { CreateActivityButton } from "@/components/activities/CreateActivityButton"
import { Plus } from "lucide-react"
import { redirect } from "next/navigation"

export default async function TasksPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth")
  }

  // Fetch all activities, then filter for tasks in memory or update service to support filtering
  // Ideally update service, but for now let's fetch all and filter.
  // Actually, let's update the service call to be more specific if possible, 
  // but getActivities currently fetches everything.
  const activities = await getActivities(user.id)
  const tasks = activities.filter(a => a.type === "TASK")

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
          <p className="text-muted-foreground">
            Manage your daily tasks.
          </p>
        </div>
        <CreateActivityButton />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tasks.map((task) => (
          <ActivityCard key={task.id} activity={task} />
        ))}
        {tasks.length === 0 && (
          <div className="col-span-full flex h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No tasks yet</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              Create your first task to get started.
            </p>
            <CreateActivityButton variant="outline">
              Create Task
            </CreateActivityButton>
          </div>
        )}
      </div>
    </div>
  )
}
