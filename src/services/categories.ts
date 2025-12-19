import { createClient } from "@/lib/supabase/server"
import { Database } from "@/types/database"

export type Category = Database["public"]["Tables"]["categories"]["Row"]

export async function getCategories(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching categories:", error)
    return []
  }

  return data as Category[]
}
