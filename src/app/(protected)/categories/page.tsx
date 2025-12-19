import { createClient } from "@/lib/supabase/server"
import { getCategories } from "@/services/categories"
import { CategoryList } from "@/components/categories/CategoryList"
import { CategoryForm } from "@/components/categories/CategoryForm"
import { redirect } from "next/navigation"

export default async function CategoriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth")

  const categories = await getCategories(user.id)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">
            Organize your tasks and events.
          </p>
        </div>
        <CategoryForm />
      </div>
      <CategoryList categories={categories} />
    </div>
  )
}
