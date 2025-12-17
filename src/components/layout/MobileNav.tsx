"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

import {
  Calendar,
  CheckSquare,
  Home,
  Tags
} from "lucide-react"
import { useTaskModal } from "@/hooks/use-task-modal"

export function MobileNav() {
  const pathname = usePathname()
  const taskModal = useTaskModal()

  const routes = [
    {
      label: "Home",
      icon: Home,
      href: "/dashboard",
    },
    {
      label: "My Tasks",
      icon: CheckSquare,
      href: "/tasks",
    },
    {
      label: "Add",
      icon: Plus,
      href: "/add",
      isFab: true,
    },
    {
      label: "Calendar",
      icon: Calendar,
      href: "/calendar",
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="flex h-16 items-center justify-around border-t bg-background/95 px-4 pb-safe glass backdrop-blur-xl safe-area-bottom">
        {routes.map((route, index) => {
          if (route.isFab) {
            return (
              <div key={index} className="relative -top-5">
                <Button
                  onClick={taskModal.onOpen}
                  size="icon"
                  className="h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="h-6 w-6" />
                  <span className="sr-only">Add Task</span>
                </Button>
              </div>
            )
          }

          const isActive = pathname === route.href

          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 text-xs transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <route.icon className={cn("h-5 w-5", isActive && "fill-current/20")} />
              <span>{route.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
