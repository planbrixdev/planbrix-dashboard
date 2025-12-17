"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Clock, AlertTriangle, ListTodo } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string | number
  description: string
  icon: React.ElementType
  className?: string
  trend?: "up" | "down" | "neutral"
  trendValue?: string
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  className,
  trend,
  trendValue,
}: StatsCardProps) {
  return (
    <Card className={cn("glass transition-all hover:scale-[1.02]", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn("p-2 rounded-full bg-background/50")}>
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {description}
          {trend && trendValue && (
            <span className={cn(
              "ml-1 font-medium",
              trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-muted-foreground"
            )}>
              {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
            </span>
          )}
        </p>
      </CardContent>
    </Card>
  )
}

export function DashboardStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Tasks"
        value="12"
        description="Total tasks for this week"
        icon={ListTodo}
        trend="up"
        trendValue="12%"
        className="bg-primary/10 border-primary/20 text-primary"
      />
      <StatsCard
        title="Completed"
        value="8"
        description="Tasks completed today"
        icon={CheckCircle2}
        className="bg-green-500/15 border-green-500/30 text-green-600"
      />
      <StatsCard
        title="Pending"
        value="4"
        description="Remaining tasks"
        icon={Clock}
        className="bg-orange-500/15 border-orange-500/30 text-orange-600"
      />
      <StatsCard
        title="Overdue"
        value="1"
        description="Tasks past due date"
        icon={AlertTriangle}
        className="bg-red-500/15 border-red-500/30 text-red-600"
        trend="down"
        trendValue="2%"
      />
    </div>
  )
}
