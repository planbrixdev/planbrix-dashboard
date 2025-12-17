import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, isToday, isTomorrow, isYesterday, isThisWeek } from "date-fns"
import { id } from "date-fns/locale"
import type { Priority } from "@/types/interfaces/task"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Priority color mapping
export const priorityColors: Record<Priority, { bg: string; text: string; border: string }> = {
  low: {
    bg: "bg-priority-low/20",
    text: "text-priority-low",
    border: "border-priority-low",
  },
  medium: {
    bg: "bg-priority-medium/20",
    text: "text-priority-medium",
    border: "border-priority-medium",
  },
  high: {
    bg: "bg-priority-high/20",
    text: "text-priority-high",
    border: "border-priority-high",
  },
  urgent: {
    bg: "bg-priority-urgent/20",
    text: "text-priority-urgent",
    border: "border-priority-urgent",
  },
}

export function getPriorityColor(priority: Priority) {
  return priorityColors[priority]
}

// Date formatting helpers
export function formatRelativeDate(date: Date): string {
  if (isToday(date)) return "Hari ini"
  if (isTomorrow(date)) return "Besok"
  if (isYesterday(date)) return "Kemarin"
  if (isThisWeek(date)) return format(date, "EEEE", { locale: id })
  return format(date, "d MMM yyyy", { locale: id })
}

export function formatDateTime(date: Date, time?: string): string {
  const dateStr = formatRelativeDate(date)
  if (time) {
    return `${dateStr}, ${time}`
  }
  return dateStr
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":")
  return `${hours}:${minutes}`
}
