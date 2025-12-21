import { create } from "zustand"
import { ActivityType } from "@/lib/validations/activities"

type ActivityTypeEnum = typeof ActivityType[keyof typeof ActivityType]

interface TaskModalStore {
  isOpen: boolean
  initialData?: {
    date?: Date
    startTime?: string
    type?: ActivityTypeEnum
  }
  onOpen: (data?: { date?: Date, startTime?: string, type?: ActivityTypeEnum }) => void
  onClose: () => void
}

export const useTaskModal = create<TaskModalStore>((set) => ({
  isOpen: false,
  initialData: undefined,
  onOpen: (data) => set({ isOpen: true, initialData: data }),
  onClose: () => set({ isOpen: false, initialData: undefined }),
}))
