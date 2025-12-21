import { create } from "zustand"
import type { CalendarActivity, ActivityWithParticipants } from "@/types/database"

// Union type to support both formats
type EventType = CalendarActivity | ActivityWithParticipants | any

interface EventDetailStore {
  isOpen: boolean
  selectedEvent: EventType | null
  onOpen: (event: EventType) => void
  onClose: () => void
}

export const useEventDetail = create<EventDetailStore>((set) => ({
  isOpen: false,
  selectedEvent: null,
  onOpen: (event) => set({ isOpen: true, selectedEvent: event }),
  onClose: () => set({ isOpen: false, selectedEvent: null }),
}))
