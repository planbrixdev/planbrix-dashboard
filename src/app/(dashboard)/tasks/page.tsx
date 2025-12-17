"use client"

import { useState, useMemo } from "react"
import { TaskFilters } from "@/components/tasks/TaskFilters"
import { TaskList } from "@/components/tasks/TaskList"
import { TaskForm } from "@/components/tasks/TaskForm"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ListFilter, Plus } from "lucide-react"
import type { Task, Priority, TaskStatus as Status, Category } from "@/types"

// Mock categories
const MOCK_CATEGORIES: Category[] = [
  { id: "c1", name: "Work", color: "#7C6AFA", created_at: "", user_id: "", icon: null },
  { id: "c2", name: "Personal", color: "#F59E0B", created_at: "", user_id: "", icon: null },
  { id: "c3", name: "Shopping", color: "#10B981", created_at: "", user_id: "", icon: null },
]

// Mock data
const MOCK_TASKS: Task[] = [
  {
    id: "1",
    user_id: "u1",
    title: "Prepare Monthly Report",
    description: "Compile data from Q3 analytics and create presentation slides.",
    due_date: new Date().toISOString(),
    start_time: "13:00",
    due_time: "14:00",
    status: "pending",
    priority: "high",
    category_id: "c1",
    category: MOCK_CATEGORIES[0],
    is_recurring: false,
    created_at: "", updated_at: "", start_date: null, all_day: false, recurrence_rule: null, parent_task_id: null, completed_at: null, deleted_at: null,
  },
  {
    id: "2",
    user_id: "u1",
    title: "Grocery Shopping",
    description: "Buy vegetables, fruits, and weekly groceries",
    due_date: new Date(Date.now() + 86400000).toISOString(),
    start_time: "09:00",
    due_time: "10:00",
    status: "pending",
    priority: "medium",
    category_id: "c3",
    category: MOCK_CATEGORIES[2],
    is_recurring: false,
    created_at: "", updated_at: "", start_date: null, all_day: false, recurrence_rule: null, parent_task_id: null, completed_at: null, deleted_at: null,
  },
  {
    id: "3",
    user_id: "u1",
    title: "Client Meeting",
    description: "Discuss project roadmap and timeline",
    due_date: new Date().toISOString(),
    start_time: "11:00",
    due_time: "13:00",
    status: "completed",
    priority: "urgent",
    category_id: "c1",
    category: MOCK_CATEGORIES[0],
    is_recurring: false,
    created_at: "", updated_at: "", start_date: null, all_day: false, recurrence_rule: null, parent_task_id: null, completed_at: null, deleted_at: null,
  },
  {
    id: "4",
    user_id: "u1",
    title: "Morning Jog",
    description: "30 minute run in the park",
    due_date: new Date().toISOString(),
    start_time: "06:30",
    due_time: "07:00",
    status: "pending",
    priority: "low",
    category_id: "c2",
    category: MOCK_CATEGORIES[1],
    is_recurring: true,
    created_at: "", updated_at: "", start_date: null, all_day: false, recurrence_rule: null, parent_task_id: null, completed_at: null, deleted_at: null,
  },
  {
    id: "5",
    user_id: "u1",
    title: "Developing API Integration",
    description: "Working on connecting to the payment gateway API",
    due_date: new Date().toISOString(),
    start_time: "14:00",
    due_time: "16:00",
    status: "in-progress",
    priority: "high",
    category_id: "c1",
    category: MOCK_CATEGORIES[0],
    is_recurring: false,
    created_at: "", updated_at: "", start_date: null, all_day: false, recurrence_rule: null, parent_task_id: null, completed_at: null, deleted_at: null,
  },
  {
    id: "6",
    user_id: "u1",
    title: "UI Design Review",
    description: "Reviewing mockups and providing feedback to design team",
    due_date: new Date().toISOString(),
    start_time: "09:00",
    due_time: "11:00",
    status: "in-progress",
    priority: "medium",
    category_id: "c1",
    category: MOCK_CATEGORIES[0],
    is_recurring: false,
    created_at: "", updated_at: "", start_date: null, all_day: false, recurrence_rule: null, parent_task_id: null, completed_at: null, deleted_at: null,
  },
]

export default function TasksPage() {
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
    return MOCK_TASKS.filter(task => {
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
  }, [searchQuery, selectedStatuses, selectedPriorities, selectedCategories])

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
    categories: MOCK_CATEGORIES,
    onClearAll: handleClearAll,
  }


  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-8rem)]">
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

        <div className="flex-1 overflow-y-auto pr-2 pb-10">
          <TaskList tasks={filteredTasks} />
        </div>
      </div>
    </div>
  )
}
