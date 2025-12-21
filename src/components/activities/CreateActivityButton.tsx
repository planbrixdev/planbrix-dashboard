"use client"

import { useState, useEffect } from "react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ActivityForm } from "./ActivityForm"
import { ActivityType } from "@/lib/validations/activities"

type ActivityTypeEnum = typeof ActivityType[keyof typeof ActivityType]

interface CreateActivityButtonProps {
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  className?: string
  children?: React.ReactNode
  defaultDate?: Date
  defaultType?: ActivityTypeEnum
  /** If true, clicking the button directly opens the dialog without dropdown */
  directOpen?: boolean
  /** Control dialog open state from outside */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CreateActivityButton({ 
  variant = "default", 
  className, 
  children,
  defaultDate,
  defaultType,
  directOpen = false,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: CreateActivityButtonProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [type, setType] = useState<ActivityTypeEnum>(defaultType || ActivityType.TASK)
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false)

  // Determine if controlled or uncontrolled
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen

  // Update type when defaultType changes
  useEffect(() => {
    if (defaultType) {
      setType(defaultType)
    }
  }, [defaultType])

  const handleOpen = (selectedType: ActivityTypeEnum) => {
    setType(selectedType)
    setOpen(true)
  }

  const handleDirectOpen = () => {
    if (defaultType) {
      setType(defaultType)
    }
    setOpen(true)
  }

  // Direct open mode - no dropdown, just opens the dialog
  if (directOpen) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant={variant} className={className} onClick={handleDirectOpen}>
            {children || (
              <>
                <Plus className="mr-2 h-4 w-4" />
                New Activity
              </>
            )}
          </Button>
        </DialogTrigger>

        <DialogContent 
          className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto"
          onInteractOutside={(e) => {
            if (isColorPickerOpen) e.preventDefault()
          }}
        >
          <DialogHeader>
            <DialogTitle>Create {type === ActivityType.EVENT ? "Event" : "Task"}</DialogTitle>
            <DialogDescription>
              Add a new {type === ActivityType.EVENT ? "event" : "task"} to your schedule.
            </DialogDescription>
          </DialogHeader>
          <ActivityForm 
            onSuccess={() => setOpen(false)} 
            defaultType={type}
            defaultDate={defaultDate}
            onColorPickerOpenChange={setIsColorPickerOpen}
          />
        </DialogContent>
      </Dialog>
    )
  }

  // Dropdown mode - shows dropdown to select type first
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} className={className}>
            {children || (
              <>
                <Plus className="mr-2 h-4 w-4" />
                New Activity
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleOpen(ActivityType.EVENT)}>
            Event
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleOpen(ActivityType.TASK)}>
            Task
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DialogContent 
        className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto"
        onInteractOutside={(e) => {
          if (isColorPickerOpen) e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>Create {type === ActivityType.EVENT ? "Event" : "Task"}</DialogTitle>
          <DialogDescription>
            Add a new {type === ActivityType.EVENT ? "event" : "task"} to your schedule.
          </DialogDescription>
        </DialogHeader>
        <ActivityForm 
          onSuccess={() => setOpen(false)} 
          defaultType={type}
          defaultDate={defaultDate}
          onColorPickerOpenChange={setIsColorPickerOpen}
        />
      </DialogContent>
    </Dialog>
  )
}
