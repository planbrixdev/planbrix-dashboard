"use server"

import { createClient } from "@/lib/supabase/server"
import { createCategorySchema, updateCategorySchema, CreateCategoryInput, UpdateCategoryInput } from "@/lib/validations/categories"
import { revalidatePath } from "next/cache"

export async function createCategory(input: CreateCategoryInput) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthorized", success: false }

    const validated = createCategorySchema.safeParse(input)
    if (!validated.success) return { error: "Invalid fields", success: false }

    const { data, error } = await supabase
      .from("categories")
      .insert({ ...validated.data, user_id: user.id })
      .select()
      .single()

    if (error) return { error: "Failed to create category", success: false }

    revalidatePath("/categories")
    return { success: true, data }
  } catch (error) {
    return { error: "Internal server error", success: false }
  }
}

export async function deleteCategory(id: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthorized", success: false }

    // Soft delete
    const { error } = await supabase
      .from("categories")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) return { error: "Failed to delete category", success: false }

    revalidatePath("/categories")
    return { success: true }
  } catch (error) {
    return { error: "Internal server error", success: false }
  }
}
