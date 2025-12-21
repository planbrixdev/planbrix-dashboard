"use client"

import { Search, Menu, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "./ThemeToggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "./Sidebar"
import { Notifications } from "./Notifications"
import { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface Profile {
  full_name: string | null
  email: string | null
  avatar_url: string | null
  username: string | null
}

interface HeaderProps {
  user: User | null
  profile: Profile | null
}

// Map routes to readable names
const routeNames: Record<string, string> = {
  dashboard: "Dashboard",
  activities: "My Activities",
  calendar: "Calendar",
  settings: "Settings",
}

export function Header({ user, profile }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Detect scroll position - check immediately on mount and on scroll
  useEffect(() => {
    // Check initial scroll position on mount
    setIsScrolled(window.scrollY > 10)
    // Small delay to ensure smooth transition after hydration
    const timer = setTimeout(() => setIsMounted(true), 50)
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    
    window.addEventListener("scroll", handleScroll)
    return () => {
      window.removeEventListener("scroll", handleScroll)
      clearTimeout(timer)
    }
  }, [])
  
  // Generate breadcrumbs from pathname
  const pathSegments = pathname.split("/").filter(Boolean)
  const currentPage = pathSegments[pathSegments.length - 1] || "dashboard"
  const pageTitle = routeNames[currentPage] || currentPage.charAt(0).toUpperCase() + currentPage.slice(1)
  
  const email = profile?.email || user?.email || "user@example.com"
  
  // Prioritize Supabase profile data if it exists.
  // Only fallback to Google metadata (user_metadata) if profile record is missing.
  const name = profile 
    ? (profile.full_name || user?.email?.split("@")[0] || "User")
    : (user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User")

  const avatarUrl = profile
    ? (profile.avatar_url || "/avatars/01.png")
    : (user?.user_metadata?.avatar_url || "/avatars/01.png")
  
  const initials = name.slice(0, 2).toUpperCase()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth")
    router.refresh()
  }

  return (
    <header 
      className={cn(
        "flex h-16 shrink-0 items-center justify-between gap-4 px-6 sticky z-30",
        // Opacity transition for smooth mounting
        isMounted ? "opacity-100" : "opacity-0",
        // Use CSS transition for all properties
        "transition-all duration-300 ease-in-out",
        // Scroll-based styles
        isScrolled 
          ? "mx-4 top-4 rounded-2xl bg-white/10 dark:bg-black/10 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg" 
          : "top-0 mx-0 rounded-none bg-transparent border-transparent shadow-none"
      )}
    >
      {/* Left: Mobile menu + Page title + Breadcrumbs */}
      <div className="flex items-center gap-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 border-r-0">
            <Sidebar className="w-full relative h-full bg-background border-none block" />
          </SheetContent>
        </Sheet>
        
        {/* Page title and breadcrumbs */}
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold leading-tight">{pageTitle}</h1>
          {/* Only show breadcrumbs if more than 1 level deep */}
          {pathSegments.length > 1 && (
            <nav className="flex items-center text-xs text-muted-foreground">
              {pathSegments.map((segment, index) => {
                const href = "/" + pathSegments.slice(0, index + 1).join("/")
                const isLast = index === pathSegments.length - 1
                const segmentName = routeNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
                
                return (
                  <span key={segment} className="flex items-center">
                    {index > 0 && <ChevronRight className="h-3 w-3 mx-1" />}
                    {isLast ? (
                      <span className="text-foreground">{segmentName}</span>
                    ) : (
                      <Link href={href} className="hover:text-foreground transition-colors">
                        {segmentName}
                      </Link>
                    )}
                  </span>
                )
              })}
            </nav>
          )}
        </div>
      </div>

      {/* Right: Search + Theme + Notifications + Profile */}
      <div className="flex items-center gap-4">
        {/* Search input */}
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search tasks..."
            className="w-64 rounded-full bg-secondary/50 pl-9 focus-visible:ring-primary/20"
          />
        </div>
        
        <ThemeToggle />

        <Notifications />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9 border transition-all hover:scale-105">
                <AvatarImage src={avatarUrl} alt="@user" />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-500 focus:bg-red-500/10 focus:text-red-500 cursor-pointer"
              onClick={handleLogout}
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
