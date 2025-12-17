"use client"

import { CategoryList } from "@/components/categories/CategoryList"
import { CategoryDialog } from "@/components/categories/CategoryDialog"
import { Separator } from "@/components/ui/separator"


export default function CategoriesPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
          <p className="text-muted-foreground">
            Manage your task categories and tags.
          </p>
        </div>
        <div className="flex items-center space-x-2">
           <CategoryDialog />
        </div>
      </div>
      <Separator />
      
      <CategoryList />
    </div>
  )
}
