"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

interface TimePickerProps {
    date?: Date
    setDate?: (date: Date) => void
    value?: string // "HH:mm" 24h format
    onChange?: (time: string) => void
    className?: string
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
    const [open, setOpen] = React.useState(false)

    // Parse value "HH:mm" to hours, minutes, period
    const parseTime = (val?: string) => {
        if (!val) return { hour: 12, minute: 0, period: "PM" as const }
        const [h, m] = val.split(":").map(Number)
        let period: "AM" | "PM" = h >= 12 ? "PM" : "AM"
        let hour = h % 12
        if (hour === 0) hour = 12
        return { hour, minute: m, period }
    }

    const { hour, minute, period } = React.useMemo(() => parseTime(value), [value])

    const hours = Array.from({ length: 12 }, (_, i) => i + 1)
    const minutes = Array.from({ length: 60 }, (_, i) => i)

    const handleTimeChange = (type: "hour" | "minute" | "period", val: number | string) => {
        let newHour = type === "hour" ? (val as number) : hour
        let newMinute = type === "minute" ? (val as number) : minute
        let newPeriod = type === "period" ? (val as string) : period

        // Convert back to 24h
        let h24 = newHour
        if (newPeriod === "PM" && newHour !== 12) h24 += 12
        if (newPeriod === "AM" && newHour === 12) h24 = 0

        const timeString = `${h24.toString().padStart(2, "0")}:${newMinute.toString().padStart(2, "0")}`
        onChange?.(timeString)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !value && "text-muted-foreground",
                        className
                    )}
                >
                    <Clock className="mr-2 h-4 w-4" />
                    {value ? (
                        <span>
                            {hour.toString().padStart(2, "0")}:{minute.toString().padStart(2, "0")} {period}
                        </span>
                    ) : (
                        <span>Pick a time</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="flex h-[300px] divide-x">
                    <ScrollArea className="h-full w-[80px]">
                        <div className="p-2 space-y-1">
                            <div className="text-xs font-semibold text-muted-foreground text-center mb-2">Hour</div>
                            {hours.map((h) => (
                                <Button
                                    key={h}
                                    variant={h === hour ? "default" : "ghost"}
                                    size="sm"
                                    className="w-full justify-center"
                                    onClick={() => handleTimeChange("hour", h)}
                                >
                                    {h.toString().padStart(2, "0")}
                                </Button>
                            ))}
                        </div>
                    </ScrollArea>
                    <ScrollArea className="h-full w-[80px]">
                        <div className="p-2 space-y-1">
                            <div className="text-xs font-semibold text-muted-foreground text-center mb-2">Minute</div>
                            {minutes.map((m) => (
                                <Button
                                    key={m}
                                    variant={m === minute ? "default" : "ghost"}
                                    size="sm"
                                    className="w-full justify-center"
                                    onClick={() => handleTimeChange("minute", m)}
                                >
                                    {m.toString().padStart(2, "0")}
                                </Button>
                            ))}
                        </div>
                    </ScrollArea>
                    <ScrollArea className="h-full w-[80px]">
                        <div className="p-2 space-y-1">
                            <div className="text-xs font-semibold text-muted-foreground text-center mb-2">Period</div>
                            {["AM", "PM"].map((p) => (
                                <Button
                                    key={p}
                                    variant={p === period ? "default" : "ghost"}
                                    size="sm"
                                    className="w-full justify-center"
                                    onClick={() => handleTimeChange("period", p)}
                                >
                                    {p}
                                </Button>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </PopoverContent>
        </Popover>
    )
}
