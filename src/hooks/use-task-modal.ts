import { create } from "zustand"

interface TaskModalStore {
  isOpen: boolean
  initialData?: {
    date?: Date
    startTime?: string
  }
  onOpen: (data?: { date?: Date, startTime?: string }) => void
  onClose: () => void
}

export const useTaskModal = create<TaskModalStore>((set) => ({
  isOpen: false,
  initialData: undefined,
  onOpen: (data) => set({ isOpen: true, initialData: data }),
  onClose: () => set({ isOpen: false, initialData: undefined }),
}))
