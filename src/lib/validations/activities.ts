import { z } from "zod"

export const ActivityType = {
  TASK: "TASK",
  EVENT: "EVENT",
} as const

export const ActivityStatus = {
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
  CANCELLED: "CANCELLED",
} as const

export const ActivityPriority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const

export const createActivitySchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    type: z.enum([ActivityType.TASK, ActivityType.EVENT]),
    status: z.enum([
      ActivityStatus.TODO,
      ActivityStatus.IN_PROGRESS,
      ActivityStatus.DONE,
      ActivityStatus.CANCELLED,
    ]),
    priority: z.enum([
      ActivityPriority.LOW,
      ActivityPriority.MEDIUM,
      ActivityPriority.HIGH,
      ActivityPriority.URGENT,
    ]),
    category_id: z.string().uuid().optional().nullable(),
    team_id: z.string().uuid().optional().nullable(),
    is_recurring: z.boolean().default(false),
    recurrence_rule: z.string().optional().nullable(),
    is_all_day: z.boolean().default(false),
    start_at: z.string().datetime({ offset: true }).optional().nullable(), // Zod datetime expects ISO string
    end_at: z.string().datetime({ offset: true }).optional().nullable(),
    due_at: z.string().datetime({ offset: true }).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.type === ActivityType.TASK) {
        return !!data.due_at
      }
      return true
    },
    {
      message: "Due date is required for tasks",
      path: ["due_at"],
    }
  )
  .refine(
    (data) => {
      if (data.type === ActivityType.EVENT) {
        return !!data.start_at && !!data.end_at
      }
      return true
    },
    {
      message: "Start and end dates are required for events",
      path: ["start_at"], // Highlighting start_at, but applies to both
    }
  )
  .refine(
    (data) => {
      if (data.type === ActivityType.EVENT && data.start_at && data.end_at) {
        return new Date(data.end_at) >= new Date(data.start_at)
      }
      return true
    },
    {
      message: "End date must be after start date",
      path: ["end_at"],
    }
  )

export const updateActivitySchema = createActivitySchema.partial().extend({
  id: z.string().uuid(),
})

export type CreateActivityInput = z.infer<typeof createActivitySchema>
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>
