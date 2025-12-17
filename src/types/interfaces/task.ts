import { Category } from "./category"

export type Priority = "low" | "medium" | "high" | "urgent"
export type TaskStatus = "pending" | "in-progress" | "completed"

export interface Task {
  id: string
  user_id: string
  title: string
  description?: string | null
  due_date?: string | null
  due_time?: string | null
  start_date?: string | null
  start_time?: string | null
  all_day: boolean
  priority: Priority
  status: TaskStatus
  category_id?: string | null
  category?: Category
  is_recurring: boolean
  recurrence_rule?: string | null
  parent_task_id?: string | null
  created_at: string
  updated_at: string
  completed_at?: string | null
  deleted_at?: string | null
}
