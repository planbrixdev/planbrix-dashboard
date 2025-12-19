import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function TaskBasicInfo() {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium">Title</Label>
        <Input
          id="title"
          placeholder="e.g., Review Q3 Marketing Plan"
          className="bg-background/50 h-10"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">Description</Label>
        <Textarea
          id="description"
          placeholder="Add details..."
          className="bg-background/50 min-h-[80px] resize-none"
        />
      </div>
    </>
  )
}
