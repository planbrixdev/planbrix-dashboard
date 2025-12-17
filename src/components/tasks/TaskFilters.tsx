"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, X } from "lucide-react"
import type { Priority, TaskStatus as Status } from "@/types"

interface TaskFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedStatuses: Status[]
  onStatusToggle: (status: Status) => void
  onStatusAll: () => void
  selectedPriorities: Priority[]
  onPriorityToggle: (priority: Priority) => void
  selectedCategories: string[]
  onCategoryToggle: (categoryId: string) => void
  categories: { id: string; name: string; color: string }[]
  onClearAll: () => void
}

export function TaskFilters({
  searchQuery,
  onSearchChange,
  selectedStatuses,
  onStatusToggle,
  onStatusAll,
  selectedPriorities,
  onPriorityToggle,
  selectedCategories,
  onCategoryToggle,
  categories,
  onClearAll,
}: TaskFiltersProps) {
  const priorities: Priority[] = ["low", "medium", "high", "urgent"]
  const statuses: Status[] = ["pending", "in-progress", "completed"]

  const isAllSelected = selectedStatuses.length === 0
  const hasActiveFilters = searchQuery || selectedStatuses.length > 0 || selectedPriorities.length > 0 || selectedCategories.length > 0

  const statusColorMap: Record<Status, string> = {
    "pending": "bg-blue-500/20 text-blue-600 border-blue-500/30",
    "in-progress": "bg-amber-500/20 text-amber-600 border-amber-500/30",
    "completed": "bg-green-500/20 text-green-600 border-green-500/30",
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 bg-secondary/50 border-0"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1 h-7 w-7"
            onClick={() => onSearchChange("")}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</h3>
        <div className="flex flex-wrap gap-2">
          {/* All Button */}
          <Badge
            variant={isAllSelected ? "default" : "outline"}
            className={`cursor-pointer capitalize transition-all ${isAllSelected
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
              }`}
            onClick={onStatusAll}
          >
            All
          </Badge>
          {/* Individual Status Buttons */}
          {statuses.map(s => {
            const isSelected = selectedStatuses.includes(s)
            return (
              <Badge
                key={s}
                variant="outline"
                className={`cursor-pointer capitalize transition-all border ${isSelected ? statusColorMap[s] : "hover:bg-muted"
                  }`}
                onClick={() => onStatusToggle(s)}
              >
                {s}
              </Badge>
            )
          })}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Priority</h3>
        <div className="flex flex-wrap gap-2">
          {priorities.map(p => {
            const isSelected = selectedPriorities.includes(p)
            const colorMap = {
              low: "bg-green-500/20 text-green-600 border-green-500/30",
              medium: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
              high: "bg-orange-500/20 text-orange-600 border-orange-500/30",
              urgent: "bg-red-500/20 text-red-600 border-red-500/30",
            }
            return (
              <Badge
                key={p}
                variant="outline"
                className={`cursor-pointer capitalize transition-all border ${isSelected ? colorMap[p] : "hover:bg-muted"
                  }`}
                onClick={() => onPriorityToggle(p)}
              >
                {p}
              </Badge>
            )
          })}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</h3>
        <div className="space-y-1">
          {categories.map(c => {
            const isSelected = selectedCategories.includes(c.id)
            return (
              <Button
                key={c.id}
                variant={isSelected ? "secondary" : "ghost"}
                size="sm"
                className="w-full justify-start text-sm font-normal"
                style={isSelected ? {
                  backgroundColor: `${c.color}20`,
                  color: c.color
                } : {}}
                onClick={() => onCategoryToggle(c.id)}
              >
                <span className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: c.color }} />
                {c.name}
              </Button>
            )
          })}
        </div>
      </div>

      {hasActiveFilters && (
        <Button
          variant="outline"
          className="w-full border-dashed text-muted-foreground"
          size="sm"
          onClick={onClearAll}
        >
          <X className="mr-2 h-3 w-3" />
          Clear All Filters
        </Button>
      )}
    </div>
  )
}
