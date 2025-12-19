"use client"

import { useTaskModal } from "@/hooks/use-task-modal"
import { ActivityForm } from "@/components/activities/ActivityForm"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useEffect, useState } from "react"

export const TaskModalProvider = () => {
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    if (!isMounted) {
        return null
    }

    return (
        <TaskModal />
    )
}

const TaskModal = () => {
    const taskModal = useTaskModal()

    return (
        <Dialog open={taskModal.isOpen} onOpenChange={(open) => !open && taskModal.onClose()}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Create Activity</DialogTitle>
                    <DialogDescription>
                        Add a new task or event to your schedule.
                    </DialogDescription>
                </DialogHeader>
                <ActivityForm onSuccess={() => taskModal.onClose()} />
            </DialogContent>
        </Dialog>
    )
}
