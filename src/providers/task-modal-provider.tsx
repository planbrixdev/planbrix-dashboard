"use client"

import { useTaskModal } from "@/hooks/use-task-modal"
import { TaskForm } from "@/components/tasks/TaskForm"

import { useEffect, useState } from "react"

export const TaskModalProvider = () => {
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        // eslint-disable-next-line
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
        <TaskForm
            open={taskModal.isOpen}
            onOpenChange={(open) => !open && taskModal.onClose()}
            initialDate={taskModal.initialData?.date}
            initialStartTime={taskModal.initialData?.startTime}
        />
    )
}
