import { z } from "zod"

export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color code").optional().or(z.literal("")),
  icon: z.string().optional().nullable(),
})

export const updateCategorySchema = createCategorySchema.partial()

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
