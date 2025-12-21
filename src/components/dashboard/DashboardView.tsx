"use client"

import { StatsCard } from "@/components/dashboard/StatsCard"
import { TodayTasks } from "@/components/dashboard/TodayTasks"
import { UpcomingTasks } from "@/components/dashboard/UpcomingTasks"
import { QuickAdd } from "@/components/dashboard/QuickAdd"
import { ActivityWithParticipants } from "@/types/database"
import { CheckCircle2, Clock, ListTodo, AlertTriangle } from "lucide-react"

interface DashboardViewProps {
  todayActivities: ActivityWithParticipants[]
  upcomingActivities: ActivityWithParticipants[]
  stats: {
    total: number
    completed: number
    pending: number
    overdue: number
  }
}

export function DashboardView({ todayActivities, upcomingActivities, stats }: DashboardViewProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Tasks"
          value={stats.total}
          description="All active tasks"
          icon={ListTodo}
        />
        <StatsCard
          title="Completed"
          value={stats.completed}
          description="Tasks finished"
          icon={CheckCircle2}
          iconClassName="text-green-500"
        />
        <StatsCard
          title="Pending"
          value={stats.pending}
          description="Tasks remaining"
          icon={Clock}
          iconClassName="text-yellow-500"
        />
        <StatsCard
          title="Overdue"
          value={stats.overdue}
          description="Tasks past due"
          icon={AlertTriangle}
          iconClassName="text-red-500"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 lg:col-span-5 space-y-6">
          <QuickAdd />
          <TodayTasks activities={todayActivities} />
        </div>
        <div className="col-span-3 lg:col-span-2">
          <UpcomingTasks activities={upcomingActivities} />
        </div>
      </div>
    </div>
  )
}
