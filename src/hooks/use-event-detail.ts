import { create } from "zustand"
import type { Task } from "@/types/interfaces/task"

interface EventDetailStore {
  isOpen: boolean
  selectedEvent: Task | null
  onOpen: (event: Task) => void
  onClose: () => void
}

export const useEventDetail = create<EventDetailStore>((set) => ({
  isOpen: false,
  selectedEvent: null,
  onOpen: (event) => set({ isOpen: true, selectedEvent: event }),
  onClose: () => set({ isOpen: false, selectedEvent: null }),
}))
