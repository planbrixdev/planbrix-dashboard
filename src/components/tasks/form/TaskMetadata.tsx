import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function TaskMetadata() {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Status</Label>
        <Select defaultValue="pending">
          <SelectTrigger className="bg-background/50 h-10">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                Pending
              </div>
            </SelectItem>
            <SelectItem value="in-progress">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                In Progress
              </div>
            </SelectItem>
            <SelectItem value="completed">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Completed
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Priority</Label>
        <Select defaultValue="medium">
          <SelectTrigger className="bg-background/50 h-10">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Low
              </div>
            </SelectItem>
            <SelectItem value="medium">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-yellow-500" />
                Medium
              </div>
            </SelectItem>
            <SelectItem value="high">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                High
              </div>
            </SelectItem>
            <SelectItem value="urgent">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Urgent
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Category</Label>
        <Select>
          <SelectTrigger className="bg-background/50 h-10">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="work">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-violet-500" />
                Work
              </div>
            </SelectItem>
            <SelectItem value="personal">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Personal
              </div>
            </SelectItem>
            <SelectItem value="shopping">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Shopping
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
