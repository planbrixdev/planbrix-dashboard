"use client"

import { Category } from "@/services/categories"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteCategory } from "@/actions/categories"
import { toast } from "sonner"
import { useTransition } from "react"

interface CategoryListProps {
  categories: Category[]
}

export function CategoryList({ categories }: CategoryListProps) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteCategory(id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Category deleted")
      }
    })
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {categories.map((category) => (
        <Card key={category.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {category.name}
            </CardTitle>
            <div
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: category.color || "#ccc" }}
            />
          </CardHeader>
          <CardContent>
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-red-600"
                onClick={() => handleDelete(category.id)}
                disabled={isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
