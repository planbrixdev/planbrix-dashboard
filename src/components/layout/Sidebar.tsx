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
  Plus
} from "lucide-react"
import { useTaskModal } from "@/hooks/use-task-modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ActivityType } from "@/lib/validations/activities"
import { SidebarCategories } from "./SidebarCategories"

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
      label: "Calendar",
      icon: Calendar,
      href: "/calendar",
      color: "text-pink-700",
    },
    {
      label: "My Activities",
      icon: CheckSquare,
      href: "/activities",
      color: "text-emerald-500",
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

          <div className="mb-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  suppressHydrationWarning
                  className="w-full justify-start h-auto p-3 rounded-lg"
                >
                  <Plus className="h-5 w-5 mr-3" />
                  New Activity
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[220px]">
                <DropdownMenuItem onClick={() => taskModal.onOpen({ type: ActivityType.EVENT })}>
                  Event
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => taskModal.onOpen({ type: ActivityType.TASK })}>
                  Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
              </Link>
            ))}
          </div>

          {/* Categories Section */}
          <div className="mt-6">
            <SidebarCategories />
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
