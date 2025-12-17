"use client"

import { useState } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

// Define the Notification type
type Priority = 'high' | 'medium' | 'low'

interface NotificationItem {
    id: string
    title: string
    time: string
    desc: string
    priority: Priority
    read: boolean
}

export function Notifications() {
    const [showNotifications, setShowNotifications] = useState(false)
    const [isPopoverOpen, setIsPopoverOpen] = useState(false)

    const notifications: NotificationItem[] = [
        {
            id: "1",
            title: "Project meeting",
            time: "1 hour ago",
            desc: "Team meeting for Q4 planning",
            priority: "medium",
            read: false
        },
        {
            id: "2",
            title: "Task overdue",
            time: "2 hours ago",
            desc: "Review marketing copy is overdue",
            priority: "high",
            read: false
        },
        {
            id: "3",
            title: "New comment",
            time: "5 hours ago",
            desc: "Sarah commented on 'Homepage Design'",
            priority: "low",
            read: true
        },
        {
            id: "4",
            title: "System Update",
            time: "1 day ago",
            desc: "System maintenance scheduled for tonight",
            priority: "high",
            read: true
        },
        {
            id: "5",
            title: "New Follower",
            time: "2 days ago",
            desc: "John Doe started following you",
            priority: "low",
            read: true
        },
        {
            id: "6",
            title: "Server Backup",
            time: "3 days ago",
            desc: "Weekly server backup completed successfully",
            priority: "medium",
            read: true
        }
    ]

    const getPriorityColor = (priority: Priority) => {
        switch (priority) {
            case 'high': return 'bg-red-500/10 border-l-4 border-red-500 hover:bg-red-500/20'
            case 'medium': return 'bg-orange-500/10 border-l-4 border-orange-500 hover:bg-orange-500/20'
            case 'low': return 'bg-blue-500/10 border-l-4 border-blue-500 hover:bg-blue-500/20'
            default: return 'bg-muted/50 border-l-4 border-muted hover:bg-muted'
        }
    }

    const unreadCount = notifications.filter(n => !n.read).length

    return (
        <>
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" />
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                    <div className="flex items-center justify-between px-4 py-2 border-b">
                        <p className="font-semibold text-sm">Notifications</p>
                        <span className="text-xs text-muted-foreground cursor-pointer hover:text-primary">Mark all as read</span>
                    </div>
                    <div className="grid gap-1 p-1 max-h-[300px] overflow-y-auto">
                        {notifications.slice(0, 3).map((item) => (
                            <div key={item.id} className={`flex flex-col gap-1 p-3 rounded-md cursor-pointer transition-colors ${getPriorityColor(item.priority)}`}>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{item.title}</span>
                                    <span className="text-xs text-muted-foreground">{item.time}</span>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-1">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                    <div className="p-2 border-t text-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full h-8 text-xs"
                            onClick={() => {
                                setIsPopoverOpen(false)
                                setShowNotifications(true)
                            }}
                        >
                            View all notifications
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>

            <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
                <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>All Notifications</DialogTitle>
                        <DialogDescription>
                            You have {unreadCount} unread notifications.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto pr-2">
                        <div className="grid gap-3">
                            {notifications.map((item) => (
                                <div key={item.id} className={`flex flex-col gap-1 p-4 rounded-lg cursor-pointer transition-colors ${getPriorityColor(item.priority)}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold">{item.title}</span>
                                            {!item.read && (
                                                <span className="w-2 h-2 rounded-full bg-primary" />
                                            )}
                                        </div>
                                        <span className="text-xs text-muted-foreground">{item.time}</span>
                                    </div>
                                    <p className="text-sm text-foreground/80">{item.desc}</p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider 
                          ${item.priority === 'high' ? 'bg-red-500/20 text-red-600' :
                                                item.priority === 'medium' ? 'bg-orange-500/20 text-orange-600' :
                                                    'bg-blue-500/20 text-blue-600'}`}>
                                            {item.priority}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
