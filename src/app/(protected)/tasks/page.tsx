import { getTasks } from "@/services/tasks"
import { getCategories } from "@/services/categories"
import { TasksView } from "@/components/tasks/TasksView"

export default async function TasksPage() {
  const [tasks, categories] = await Promise.all([
    getTasks(),
    getCategories()
  ])

  return <TasksView initialTasks={tasks} categories={categories} />
}
