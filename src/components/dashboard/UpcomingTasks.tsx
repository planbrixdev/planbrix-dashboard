"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar as CalendarIcon } from "lucide-react"
import { addDays, format } from "date-fns"

export function UpcomingTasks() {
  const dates = [1, 2, 3].map(days => addDays(new Date(), days))

  return (
    <Card className="col-span-1 md:col-span-1 glass h-full bg-gradient-to-b from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          Upcoming
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 relative">
          {/* Timeline line */}
          <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-border z-0" />

          {dates.map((date, i) => (
            <div key={i} className="relative z-10 flex gap-4">
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-background shadow-sm text-xs font-bold">
                  <div className="text-center leading-none">
                    <span className="block text-primary uppercase text-[8px] mb-0.5">{format(date, "MMM")}</span>
                    <span className="text-sm">{format(date, "d")}</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 pt-1 space-y-3 pb-2">
                <div className="text-sm font-medium">Project Review</div>
                <div className="text-xs text-muted-foreground">10:00 AM • Work</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
