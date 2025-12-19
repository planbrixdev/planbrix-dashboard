"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Category } from "@/types/interfaces/category"
import { categorySchema, CategoryFormValues } from "@/lib/validations/category"

interface CategoryDialogProps {
  category?: Category
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CategoryDialog({ category, trigger, open, onOpenChange }: CategoryDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  
  // Use controlled or uncontrolled state
  const isControlled = open !== undefined && onOpenChange !== undefined
  const finalOpen = isControlled ? open : internalOpen
  const finalOnOpenChange = isControlled ? onOpenChange : setInternalOpen

  const isEditing = !!category

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || "",
      color: category?.color || "#3b82f6",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
    // Here you would call your API/store to save
    finalOnOpenChange(false)
    form.reset()
  }

  return (
    <Dialog open={finalOpen} onOpenChange={finalOnOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            New Category
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Category" : "Create Category"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update your category details." : "Add a new category to organize your tasks."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Work, Personal, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                       <Input type="color" className="w-12 p-1 h-10 cursor-pointer" {...field} />
                       <Input placeholder="#000000" {...field} className="uppercase font-mono" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">{isEditing ? "Save Changes" : "Create Category"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
