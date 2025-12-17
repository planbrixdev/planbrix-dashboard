"use client"

import { DashboardStats } from "@/components/dashboard/StatsCard"
import { TodayTasks } from "@/components/dashboard/TodayTasks"
import { UpcomingTasks } from "@/components/dashboard/UpcomingTasks"
import { QuickAdd } from "@/components/dashboard/QuickAdd"
import { EventDetailDialog } from "@/components/calendar/EventDetailDialog"

export default function DashboardPage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Dashboard
          </h2>
          <p className="text-muted-foreground">
            Here&apos;s an overview of your tasks for today.
          </p>
        </div>
      </div>

      <DashboardStats />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 lg:col-span-5 space-y-6">
          <QuickAdd />
          <TodayTasks />
        </div>
        <div className="col-span-3 lg:col-span-2">
          <UpcomingTasks />
        </div>
      </div>
      <EventDetailDialog />
    </div>
  )
}
