"use client"

import { TaskCard } from "@/components/tasks/TaskCard"
import type { Task } from "@/types"

interface TaskListProps {
  tasks: Task[]
}

export function TaskList({ tasks }: TaskListProps) {
  const pendingTasks = tasks.filter(t => t.status === 'pending')
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress')
  const completedTasks = tasks.filter(t => t.status === 'completed')

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <span className="text-2xl">📋</span>
        </div>
        <h3 className="font-medium mb-1">No tasks found</h3>
        <p className="text-sm text-muted-foreground">
          Try adjusting your filters or create a new task
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* In Progress Tasks */}
      {inProgressTasks.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-amber-600 dark:text-amber-500 flex items-center gap-2 mb-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            In Progress <span className="text-xs bg-amber-500/20 text-amber-600 px-2 py-0.5 rounded-full">{inProgressTasks.length}</span>
          </h3>
          <div className="grid gap-3">
            {inProgressTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-3">
            <span className="h-2 w-2 rounded-full bg-blue-500"></span>
            Pending <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{pendingTasks.length}</span>
          </h3>
          <div className="grid gap-3">
            {pendingTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-green-600 dark:text-green-500 flex items-center gap-2 mb-3">
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            Completed <span className="text-xs bg-green-500/20 text-green-600 px-2 py-0.5 rounded-full">{completedTasks.length}</span>
          </h3>
          <div className="grid gap-3">
            {completedTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
