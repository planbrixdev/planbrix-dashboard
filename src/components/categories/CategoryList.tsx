"use client"

import { MoreHorizontal, Pencil, Trash2, Tag, Plus } from "lucide-react"
import { Category } from "@/types/interfaces/category"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CategoryDialog } from "./CategoryDialog"

import { useState } from "react"

const MOCK_CATEGORIES: Category[] = [
  { id: "1", name: "Work", color: "#7C6AFA", user_id: "u1", created_at: "2023-01-01" },
  { id: "2", name: "Personal", color: "#F59E0B", user_id: "u1", created_at: "2023-01-01" },
  { id: "3", name: "Health", color: "#10B981", user_id: "u1", created_at: "2023-01-01" },
  { id: "4", name: "Finance", color: "#EF4444", user_id: "u1", created_at: "2023-01-01" },
  { id: "5", name: "Education", color: "#3B82F6", user_id: "u1", created_at: "2023-01-01" },
]

export function CategoryList() {
  const [categories] = useState<Category[]>(MOCK_CATEGORIES)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map((category) => (
        <div key={category.id} className="group relative flex items-center p-4 bg-card hover:bg-muted/50 border rounded-xl shadow-sm transition-all hover:shadow-md">
          <div
            className="h-12 w-12 rounded-lg flex items-center justify-center mr-4 shadow-sm"
            style={{ backgroundColor: `${category.color}20` }}
          >
            <Tag className="h-6 w-6" style={{ color: category.color }} />
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-lg">{category.name}</h3>
            <p className="text-sm text-muted-foreground">{category.name.length * 3} tasks</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditingCategory(category)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}

      <CategoryDialog
        trigger={
          <button className="flex items-center justify-center p-4 border-2 border-dashed rounded-xl hover:bg-muted/30 hover:border-primary/50 transition-colors h-full min-h-[88px] text-muted-foreground hover:text-primary">
            <Plus className="mr-2 h-5 w-5" />
            <span className="font-medium">Add New Category</span>
          </button>
        }
      />

      {editingCategory && (
        <CategoryDialog
          key={editingCategory.id}
          category={editingCategory}
          open={true}
          onOpenChange={(open) => !open && setEditingCategory(null)}
          trigger={<span className="hidden" />}
        />
      )}
    </div>
  )
}
