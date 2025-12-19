"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ActivityForm } from "./ActivityForm"

interface CreateActivityButtonProps {
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  className?: string
  children?: React.ReactNode
}

export function CreateActivityButton({ variant = "default", className, children }: CreateActivityButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} className={className}>
          {children || (
            <>
              <Plus className="mr-2 h-4 w-4" />
              New Activity
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Activity</DialogTitle>
          <DialogDescription>
            Add a new task or event to your schedule.
          </DialogDescription>
        </DialogHeader>
        <ActivityForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
