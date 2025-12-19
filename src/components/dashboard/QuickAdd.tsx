"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Loader2 } from "lucide-react"
import { useState, useTransition } from "react"
import { createActivity } from "@/actions/activities"
import { ActivityType, ActivityStatus, ActivityPriority } from "@/lib/validations/activities"
import { toast } from "sonner"

export function QuickAdd() {
    const [title, setTitle] = useState("")
    const [isPending, startTransition] = useTransition()

    const handleQuickAdd = () => {
        if (!title.trim()) return

        startTransition(async () => {
            const result = await createActivity({
                title: title,
                type: ActivityType.TASK,
                status: ActivityStatus.TODO,
                priority: ActivityPriority.MEDIUM,
                due_at: new Date().toISOString(), // Due today by default
                is_recurring: false,
                is_all_day: false
            })

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Task added")
                setTitle("")
            }
        })
    }

    return (
        <Card className="glass border-dashed border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-4 flex gap-2 items-center">
                <Input 
                    placeholder="Quick add a task for today..." 
                    className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleQuickAdd()
                    }}
                />
                <Button 
                    size="sm" 
                    onClick={handleQuickAdd} 
                    disabled={!title.trim() || isPending}
                >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Add
                </Button>
            </CardContent>
        </Card>
    )
}
