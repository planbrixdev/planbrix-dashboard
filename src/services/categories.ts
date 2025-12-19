import type { Category } from "@/types/interfaces/category"

export const MOCK_CATEGORIES: Category[] = [
  { id: "c1", name: "Work", color: "#7C6AFA", created_at: "", user_id: "", icon: null },
  { id: "c2", name: "Personal", color: "#F59E0B", created_at: "", user_id: "", icon: null },
  { id: "c3", name: "Shopping", color: "#10B981", created_at: "", user_id: "", icon: null },
]

export async function getCategories(): Promise<Category[]> {
  // Simulate DB call
  return MOCK_CATEGORIES
}
