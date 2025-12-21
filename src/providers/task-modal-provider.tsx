"use client"

import { useTaskModal } from "@/hooks/use-task-modal"
import { ActivityForm } from "@/components/activities/ActivityForm"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { CalendarView } from "@/components/calendar/CalendarView"
import { createClient } from "@/lib/supabase/client"
import { ActivityWithParticipants } from "@/types/database"
import { Button } from "@/components/ui/button"

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
    const type = taskModal.initialData?.type
    const [isExpanded, setIsExpanded] = useState(false)
    const [activities, setActivities] = useState<ActivityWithParticipants[]>([])
    const supabase = createClient()

    useEffect(() => {
        if (taskModal.isOpen && isExpanded) {
            const fetchActivities = async () => {
                const { data } = await supabase
                    .from('activities')
                    .select('*, participants:activity_participants(*)')
                
                if (data) {
                    setActivities(data as any)
                }
            }
            fetchActivities()
        }
    }, [taskModal.isOpen, isExpanded])

    useEffect(() => {
        if (!taskModal.isOpen) {
            setIsExpanded(false)
        }
    }, [taskModal.isOpen])

    return (
        <Dialog open={taskModal.isOpen} onOpenChange={(open) => !open && taskModal.onClose()}>
            <DialogContent 
                className="!p-0 !gap-0 !bg-transparent !border-none !shadow-none !flex !fixed !inset-0 !w-screen !h-screen !max-w-none !m-0 !rounded-none !translate-x-0 !translate-y-0"
                showCloseButton={false}
            >
                <div className="flex items-center justify-center w-full h-full">
                    <div 
                        className={cn(
                            "flex overflow-hidden bg-muted",
                            "transition-all duration-300 ease-in-out",
                            isExpanded 
                                ? "w-full h-full rounded-none" 
                                : "w-[540px] h-[85vh] shadow-2xl rounded-lg"
                        )}
                    >
                        {/* Left Panel: Form */}
                        <div 
                            className={cn(
                                "flex flex-col shrink-0 w-[500px] p-3 pr-0"
                            )}
                        >
                            <div className="flex-1 flex flex-col bg-background rounded-lg border shadow-sm overflow-hidden">
                                <div className="p-6 pb-4 border-b flex items-center justify-between shrink-0">
                                    <DialogHeader>
                                        <DialogTitle>Create {type === "EVENT" ? "Event" : type === "TASK" ? "Task" : "Activity"}</DialogTitle>
                                    </DialogHeader>
                                    <Button variant="ghost" size="icon" onClick={() => taskModal.onClose()} className="h-8 w-8">
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                    <ActivityForm onSuccess={() => taskModal.onClose()} defaultType={type} />
                                </div>
                            </div>
                        </div>

                        {/* Toggle Button */}
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className={cn(
                                "bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors focus:outline-none shrink-0",
                                isExpanded ? "w-10" : "flex-1 min-w-[8px]"
                            )}
                            title={isExpanded ? "Collapse calendar" : "Expand calendar"}
                        >
                            {isExpanded ? (
                                <ChevronLeft className="h-6 w-6 text-foreground" />
                            ) : (
                                <ChevronRight className="h-6 w-6 text-foreground" />
                            )}
                        </button>

                        {/* Right Panel: Calendar */}
                        <div 
                            className={cn(
                                "bg-background flex flex-col h-full overflow-hidden",
                                "transition-all duration-300 ease-in-out",
                                isExpanded ? "flex-1 opacity-100" : "w-0 opacity-0"
                            )}
                        >
                            <div className="flex-1 p-4 overflow-hidden h-full min-w-[600px]">
                                <CalendarView activities={activities} hideCreateButton={true} className="h-full" />
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
