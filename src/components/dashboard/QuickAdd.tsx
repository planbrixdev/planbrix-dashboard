"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Calendar, Tag, Flag } from "lucide-react"
import { useTaskModal } from "@/hooks/use-task-modal"

export function QuickAdd() {
    const { onOpen } = useTaskModal()

    return (
        <Card className="glass border-primary/20 shadow-lg shadow-primary/5">
            <CardContent className="p-4">
                <div className="flex flex-col gap-3">
                    <div className="relative">
                        <Input
                            placeholder="What needs to be done?"
                            className="border-0 bg-transparent text-lg font-medium placeholder:text-muted-foreground/60 focus-visible:ring-0 px-0 shadow-none h-auto py-2 cursor-pointer"
                            onClick={() => onOpen()}
                            readOnly
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                onClick={() => onOpen({ date: new Date() })}
                            >
                                <Calendar className="mr-2 h-4 w-4" />
                                Today
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                onClick={() => onOpen()}
                            >
                                <Tag className="mr-2 h-4 w-4" />
                                Category
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                onClick={() => onOpen()}
                            >
                                <Flag className="mr-2 h-4 w-4" />
                                Priority
                            </Button>
                        </div>

                        <Button
                            size="sm"
                            className="bg-primary hover:bg-primary/90 text-white rounded-lg"
                            onClick={() => onOpen()}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Task
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
