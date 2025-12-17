export type CalendarView = "month" | "week" | "day" | "list"

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  allDay?: boolean
  resource?: unknown
}
