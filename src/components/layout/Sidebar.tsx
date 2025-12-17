"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  CheckSquare,
  LayoutDashboard,
  Settings,
  Tags,
  Plus
} from "lucide-react"
import { useTaskModal } from "@/hooks/use-task-modal"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const taskModal = useTaskModal()

  const mainRoutes = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
      color: "text-sky-500",
    },
    {
      label: "My Tasks",
      icon: CheckSquare,
      href: "/tasks",
      color: "text-violet-500",
      count: 0,
    },
    {
      label: "Calendar",
      icon: Calendar,
      href: "/calendar",
      color: "text-pink-700",
    },
    {
      label: "Categories",
      icon: Tags,
      href: "/categories",
      color: "text-orange-700",
    },
  ]

  const bottomRoutes = [
    {
      label: "Settings",
      icon: Settings,
      href: "/settings",
      color: "text-gray-500",
    },
  ]

  return (
    <div className={cn("pb-12 min-h-screen border-r bg-card/50 glass hidden md:block w-64 fixed left-0 top-0 h-full flex flex-col", className)}>
      <div className="flex-1 space-y-4 py-4">
        <div className="px-3 py-2">
          <Link href="/dashboard" className="flex items-center pl-3 mb-10 mt-2">
            <div className="relative w-8 h-8 mr-2 bg-primary rounded-lg flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
              Planbrix
            </h1>
          </Link>

          <div className="px-3 mb-6">
            <Button
              onClick={taskModal.onOpen}
              className="w-full justify-start bg-primary/10 hover:bg-primary/20 text-primary border-0"
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </div>

          <div className="space-y-1">
            <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
              Menu
            </h2>
            {mainRoutes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:bg-primary/10 hover:text-primary rounded-lg transition duration-200",
                  pathname === route.href ? "bg-primary/10 text-primary" : "text-muted-foreground"
                )}
              >
                <div className="flex items-center flex-1">
                  <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                  {route.label}
                </div>
                {route.count !== undefined && route.count > 0 && (
                  <span className="bg-primary/20 text-primary text-xs py-0.5 px-2 rounded-full">
                    {route.count}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Settings Section */}
      <div className="px-3 py-4 border-t border-border/50">
        {bottomRoutes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:bg-primary/10 hover:text-primary rounded-lg transition duration-200",
              pathname === route.href ? "bg-primary/10 text-primary" : "text-muted-foreground"
            )}
          >
            <div className="flex items-center flex-1">
              <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
              {route.label}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
