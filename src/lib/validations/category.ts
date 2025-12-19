import * as z from "zod"

export const categorySchema = z.object({
  name: z.string().min(2, {
    message: "Category name must be at least 2 characters.",
  }),
  color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, {
    message: "Invalid color hex code.",
  }),
})

export type CategoryFormValues = z.infer<typeof categorySchema>
