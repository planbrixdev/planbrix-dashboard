"use client"

import { useState, useRef } from "react"
import { Plus, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface PendingCategory {
  name: string
  color: string
  tempId: string // temporary ID for UI purposes
}

interface InlineCategoryFormProps {
  onAdd: (category: PendingCategory) => void
  onCancel: () => void
  onColorPickerOpenChange?: (isOpen: boolean) => void
}

const PRESET_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
]

export function InlineCategoryForm({ onAdd, onCancel, onColorPickerOpenChange }: InlineCategoryFormProps) {
  const [name, setName] = useState("")
  const [color, setColor] = useState(PRESET_COLORS[5]) // default blue
  const [error, setError] = useState("")
  const colorInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError("Name is required")
      return
    }
    if (trimmedName.length > 50) {
      setError("Name must be 50 characters or less")
      return
    }

    onAdd({
      name: trimmedName,
      color,
      tempId: `temp_${Date.now()}`,
    })
    setName("")
    setColor(PRESET_COLORS[5])
    setError("")
  }

  const handleColorInputClick = () => {
    colorInputRef.current?.click()
  }

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setColor(e.target.value)
  }

  const handleColorInputBlur = () => {
    onColorPickerOpenChange?.(false)
  }

  return (
    <div className="p-3 space-y-3">
      <div className="space-y-2">
        <Input
          placeholder="Category name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError("")
          }}
          className="h-9 text-sm"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleSubmit()
            }
            if (e.key === "Escape") {
              onCancel()
            }
          }}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      <div className="space-y-1.5">
        <span className="text-xs text-muted-foreground">Color:</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {PRESET_COLORS.map((presetColor) => (
            <button
              key={presetColor}
              type="button"
              className={cn(
                "w-6 h-6 rounded-full ring-offset-background transition-all shrink-0",
                color === presetColor && "ring-2 ring-ring ring-offset-1"
              )}
              style={{ backgroundColor: presetColor }}
              onClick={() => setColor(presetColor)}
            />
          ))}
          {/* Custom color picker - rainbow circle or selected custom color */}
          <button
            type="button"
            className={cn(
              "w-6 h-6 rounded-full ring-offset-background transition-all shrink-0 relative overflow-hidden",
              !PRESET_COLORS.includes(color) && "ring-2 ring-ring ring-offset-1"
            )}
            style={{
              background: !PRESET_COLORS.includes(color) 
                ? color 
                : "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)"
            }}
            onClick={handleColorInputClick}
            title="Custom color"
          >
            <input
              ref={colorInputRef}
              type="color"
              value={color}
              onChange={handleColorChange}
              onFocus={() => onColorPickerOpenChange?.(true)}
              onBlur={handleColorInputBlur}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full pointer-events-none"
              tabIndex={-1}
            />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 px-3 text-xs"
          onClick={onCancel}
        >
          <X className="h-3.5 w-3.5 mr-1.5" />
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          className="h-8 px-3 text-xs"
          onClick={handleSubmit}
        >
          <Check className="h-3.5 w-3.5 mr-1.5" />
          Add
        </Button>
      </div>
    </div>
  )
}

interface AddCategoryButtonProps {
  onClick: () => void
}

export function AddCategoryButton({ onClick }: AddCategoryButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent focus:bg-accent text-primary"
    >
      <Plus className="h-4 w-4 mr-2" />
      Add new category
    </button>
  )
}
