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

interface TimePickerProps {
    date?: Date
    setDate?: (date: Date) => void
    value?: string // "HH:mm" 24h format
    onChange?: (time: string) => void
    className?: string
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
    const [open, setOpen] = React.useState(false)

    // Parse value "HH:mm" to hours, minutes
    const parseTime = (val?: string) => {
        if (!val) return { hour: 9, minute: 0 }
        const [h, m] = val.split(":").map(Number)
        return { hour: h, minute: m }
    }

    const { hour, minute } = React.useMemo(() => parseTime(value), [value])

    const hours = Array.from({ length: 24 }, (_, i) => i)
    const minutes = Array.from({ length: 60 }, (_, i) => i)

    const handleTimeChange = (type: "hour" | "minute", val: number) => {
        let newHour = type === "hour" ? val : hour
        let newMinute = type === "minute" ? val : minute

        const timeString = `${newHour.toString().padStart(2, "0")}:${newMinute.toString().padStart(2, "0")}`
        onChange?.(timeString)
    }

    return (
        <Popover open={open} onOpenChange={setOpen} modal={true}>
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
                            {hour.toString().padStart(2, "0")}:{minute.toString().padStart(2, "0")}
                        </span>
                    ) : (
                        <span>Pick a time</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[60]" align="start">
                <div className="flex h-[300px] divide-x">
                    <div className="h-full w-[80px] overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
                    </div>
                    <div className="h-full w-[80px] overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
