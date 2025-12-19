"use client"

import { useState, useMemo } from "react"
import { TaskFilters } from "@/components/tasks/TaskFilters"
import { TaskList } from "@/components/tasks/TaskList"
import { TaskForm } from "@/components/tasks/TaskForm"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ListFilter, Plus } from "lucide-react"
import type { Task, Priority, TaskStatus as Status } from "@/types/interfaces/task"
import type { Category } from "@/types/interfaces/category"

interface TasksViewProps {
  initialTasks: Task[]
  categories: Category[]
}

export function TasksView({ initialTasks, categories }: TasksViewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatuses, setSelectedStatuses] = useState<Status[]>([])
  const [selectedPriorities, setSelectedPriorities] = useState<Priority[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const handleStatusToggle = (status: Status) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    )
  }

  const handleStatusAll = () => {
    setSelectedStatuses([])
  }

  const handlePriorityToggle = (priority: Priority) => {
    setSelectedPriorities(prev =>
      prev.includes(priority)
        ? prev.filter(p => p !== priority)
        : [...prev, priority]
    )
  }

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    )
  }

  const handleClearAll = () => {
    setSearchQuery("")
    setSelectedStatuses([])
    setSelectedPriorities([])
    setSelectedCategories([])
  }

  const filteredTasks = useMemo(() => {
    return initialTasks.filter(task => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // Status filter (multi-select)
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(task.status)) {
        return false
      }

      // Priority filter
      if (selectedPriorities.length > 0 && !selectedPriorities.includes(task.priority)) {
        return false
      }

      // Category filter
      if (selectedCategories.length > 0 && (!task.category || !selectedCategories.includes(task.category.id))) {
        return false
      }

      return true
    })
  }, [initialTasks, searchQuery, selectedStatuses, selectedPriorities, selectedCategories])

  const filterProps = {
    searchQuery,
    onSearchChange: setSearchQuery,
    selectedStatuses,
    onStatusToggle: handleStatusToggle,
    onStatusAll: handleStatusAll,
    selectedPriorities,
    onPriorityToggle: handlePriorityToggle,
    selectedCategories,
    onCategoryToggle: handleCategoryToggle,
    categories: categories,
    onClearAll: handleClearAll,
  }


  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-9rem)]">
      {/* Sidebar Filters - Desktop */}
      <aside className="hidden md:block w-64 shrink-0 space-y-6">
        <div className="sticky top-6">
          <h2 className="text-lg font-semibold mb-4 px-1">Filters</h2>
          <TaskFilters {...filterProps} />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Tasks</h1>
            <p className="text-muted-foreground">
              {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} found
            </p>
          </div>

          <TaskForm>
            <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </TaskForm>
        </div>

        {/* Mobile Filter Toggle */}
        <div className="md:hidden mb-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full">
                <ListFilter className="mr-2 h-4 w-4" />
                Filters
                {(selectedStatuses.length > 0 || selectedPriorities.length > 0 || selectedCategories.length > 0) && (
                  <span className="ml-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    {selectedStatuses.length + selectedPriorities.length + selectedCategories.length}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <TaskFilters {...filterProps} />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 pb-20 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <TaskList tasks={filteredTasks} />
        </div>
      </div>
    </div>
  )
}
