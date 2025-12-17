"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Calendar, Tag, Flag, Clock, X } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { TimePicker } from "@/components/ui/time-picker"

const formatTimeDisplay = (time: string) => {
    if (!time) return ""
    const [h, m] = time.split(":").map(Number)
    const period = h >= 12 ? "PM" : "AM"
    const hour = h % 12 || 12
    return `${hour}:${m.toString().padStart(2, "0")} ${period}`
}


// Mock Categories (Simulated)
const MOCK_CATEGORIES = [
    { id: "c1", name: "Work", color: "#7C6AFA" },
    { id: "c2", name: "Personal", color: "#F59E0B" },
    { id: "c3", name: "Shopping", color: "#10B981" },
    { id: "c4", name: "Finance", color: "#EF4444" },
]

const PRIORITIES = [
    { value: "low", label: "Low", color: "text-blue-500" },
    { value: "medium", label: "Medium", color: "text-orange-500" },
    { value: "high", label: "High", color: "text-red-500" },
    { value: "urgent", label: "Urgent", color: "text-red-700 font-bold" },
]

export function QuickAdd() {
    const [text, setText] = useState("")
    const [date, setDate] = useState<Date | undefined>(undefined)
    const [startTime, setStartTime] = useState("")
    const [endTime, setEndTime] = useState("")
    const [categoryId, setCategoryId] = useState<string | undefined>(undefined)
    const [priority, setPriority] = useState<string | undefined>(undefined)
    const [isExpanded, setIsExpanded] = useState(false)

    // Auto-resize textarea logic could be here, but standard Textarea is fine or 'autosize' lib

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value)
        if (e.target.value.length > 0 && !isExpanded) {
            setIsExpanded(true)
        }
    }

    const parseAndSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!text.trim()) return

        // Parsing Logic
        // 1. Split by newline
        // 2. If no newline, split by " - "
        let title = ""
        let description = ""

        if (text.includes("\n")) {
            const parts = text.split("\n")
            title = parts[0].trim()
            description = parts.slice(1).join("\n").trim()
        } else if (text.includes(" - ")) {
            const parts = text.split(" - ")
            title = parts[0].trim()
            description = parts.slice(1).join(" - ").trim()
        } else {
            title = text.trim()
        }

        const taskData = {
            title,
            description,
            date,
            startTime,
            endTime,
            categoryId,
            priority,
            status: "pending"
        }

        console.log("Creating Task:", taskData)

        // Simulate Success
        alert(`Task Created!\nTitle: ${title}\nDesc: ${description}\nDate: ${date ? format(date, 'PPP') : 'None'}\nTime: ${startTime}-${endTime}`)

        // Reset
        setText("")
        setDate(undefined)
        setStartTime("")
        setEndTime("")
        setCategoryId(undefined)
        setPriority(undefined)
        setIsExpanded(false)
    }

    const selectedCategory = MOCK_CATEGORIES.find(c => c.id === categoryId)
    const selectedPriority = PRIORITIES.find(p => p.value === priority)

    return (
        <Card className={cn("glass border-primary/20 shadow-lg shadow-primary/5 transition-all duration-300", isExpanded ? "ring-2 ring-primary/10" : "")}>
            <CardContent className="p-4">
                <form onSubmit={parseAndSubmit} className="flex flex-col gap-3">
                    <div className="relative">
                        <Textarea
                            placeholder="What needs to be done? (Hit Enter for description)"
                            className={cn(
                                "border-0 bg-transparent text-lg font-medium placeholder:text-muted-foreground/60 focus-visible:ring-0 px-0 shadow-none py-2 resize-none transition-all",
                                isExpanded ? "min-h-[80px]" : "h-[44px] min-h-[44px] overflow-hidden"
                            )}
                            value={text}
                            onChange={handleTextChange}
                            onFocus={() => setIsExpanded(true)}
                        />
                    </div>

                    {/* Action Bar - Only show relevant parts or always show? 
                        User wants inline selection.
                    */}
                    <div className={cn("flex items-center justify-between gap-2 overflow-x-auto pb-1 transition-all", isExpanded ? "opacity-100" : "opacity-80")}>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Date Picker */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button type="button" variant={date ? "secondary" : "ghost"} size="sm" className={cn("h-7 px-2 text-xs", date && "bg-primary/10 text-primary hover:bg-primary/20")}>
                                        <Calendar className="mr-1.5 h-3.5 w-3.5" />
                                        {date ? format(date, "MMM d") : "Date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <CalendarComponent
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>

                            {/* Time Picker */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button type="button" variant={(startTime || endTime) ? "secondary" : "ghost"} size="sm" className={cn("h-7 px-2 text-xs", (startTime || endTime) && "bg-primary/10 text-primary hover:bg-primary/20")}>
                                        <Clock className="mr-1.5 h-3.5 w-3.5" />
                                        {startTime ? `${formatTimeDisplay(startTime)}${endTime ? ' - ' + formatTimeDisplay(endTime) : ''}` : "Time"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-4" align="start">
                                    <div className="flex gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-medium text-muted-foreground">Start Time</Label>
                                            <TimePicker
                                                value={startTime}
                                                onChange={setStartTime}
                                                className="h-8 w-[140px]"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-medium text-muted-foreground">End Time</Label>
                                            <TimePicker
                                                value={endTime}
                                                onChange={setEndTime}
                                                className="h-8 w-[140px]"
                                            />
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>

                            {/* Category Picker */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button type="button" variant={categoryId ? "secondary" : "ghost"} size="sm" className={cn("h-7 px-2 text-xs", categoryId && "bg-primary/10 text-primary hover:bg-primary/20")}>
                                        <Tag className="mr-1.5 h-3.5 w-3.5" />
                                        {selectedCategory ? selectedCategory.name : "Category"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48 p-1" align="start">
                                    <div className="grid gap-1">
                                        {MOCK_CATEGORIES.map((cat) => (
                                            <div
                                                key={cat.id}
                                                className={cn(
                                                    "flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded-sm cursor-pointer text-sm",
                                                    categoryId === cat.id && "bg-muted font-medium"
                                                )}
                                                onClick={() => setCategoryId(cat.id)}
                                            >
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                                {cat.name}
                                            </div>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>

                            {/* Priority Picker */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button type="button" variant={priority ? "secondary" : "ghost"} size="sm" className={cn("h-7 px-2 text-xs", priority && "bg-primary/10 text-primary hover:bg-primary/20", priority && selectedPriority?.color)}>
                                        <Flag className="mr-1.5 h-3.5 w-3.5" />
                                        {selectedPriority?.label || "Priority"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-32 p-1" align="start">
                                    <div className="grid gap-1">
                                        {PRIORITIES.map((p) => (
                                            <div
                                                key={p.value}
                                                className={cn(
                                                    "flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded-sm cursor-pointer text-sm",
                                                    priority === p.value && "bg-muted font-medium",
                                                    p.color
                                                )}
                                                onClick={() => setPriority(p.value)}
                                            >
                                                <Flag className="h-3 w-3" />
                                                {p.label}
                                            </div>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <Button
                            type="submit"
                            size="sm"
                            className={cn("bg-primary hover:bg-primary/90 text-white rounded-lg transition-all", !text.trim() && "opacity-50 cursor-not-allowed")}
                            disabled={!text.trim()}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
