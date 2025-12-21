/**
 * Recurrence Utility Functions
 * 
 * Handles expansion of RRULE strings into individual occurrences,
 * and provides utilities for working with recurring activities.
 */

import { RRule, RRuleSet, rrulestr } from "rrule"
import { 
  addMinutes, 
  differenceInMinutes, 
  isBefore, 
  isAfter, 
  startOfDay, 
  endOfDay,
  format 
} from "date-fns"

export interface OccurrenceInfo {
  occurrenceAt: Date
  originalStart: Date
  originalEnd?: Date
  originalDue?: Date
}

export interface ExpandedActivity {
  id: string
  activityId: string
  instanceId?: string | null
  title: string
  description?: string | null
  type: "TASK" | "EVENT"
  status: "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED"
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  categoryId?: string | null
  isRecurring: boolean
  recurrenceRule?: string | null
  isAllDay: boolean
  startAt?: Date | null
  endAt?: Date | null
  dueAt?: Date | null
  occurrenceAt?: Date | null
  isInstance: boolean
  isCancelled?: boolean
  isOverridden?: boolean
  category?: any
  participants?: any[]
  userId?: string | null
  teamId?: string | null
}

export interface ActivityInstance {
  id: string
  activity_id?: string | null
  occurrence_at: string
  status?: string | null
  overridden_start_at?: string | null
  overridden_end_at?: string | null
  overridden_due_at?: string | null
  completed_at?: string | null
  is_cancelled?: boolean | null
}

/**
 * Parse an RRULE string and return the RRule object
 */
export function parseRecurrenceRule(rule: string): RRule | null {
  if (!rule) return null
  
  try {
    // Handle both RRULE: prefix and without
    const cleanRule = rule.startsWith("RRULE:") ? rule : `RRULE:${rule}`
    return rrulestr(cleanRule) as RRule
  } catch (error) {
    console.error("Failed to parse recurrence rule:", error)
    return null
  }
}

/**
 * Expand a recurring activity into individual occurrences within a date range
 */
export function expandRecurrenceOccurrences(
  rule: string,
  baseDate: Date,
  rangeStart: Date,
  rangeEnd: Date,
  maxOccurrences: number = 365
): Date[] {
  const rrule = parseRecurrenceRule(rule)
  if (!rrule) return []

  try {
    // Create a new RRule with the base date as dtstart
    const rruleWithStart = new RRule({
      ...rrule.options,
      dtstart: baseDate,
    })

    // Get occurrences within the range
    const occurrences = rruleWithStart.between(
      startOfDay(rangeStart),
      endOfDay(rangeEnd),
      true // inclusive
    )

    return occurrences.slice(0, maxOccurrences)
  } catch (error) {
    console.error("Failed to expand recurrence:", error)
    return []
  }
}

/**
 * Get the next occurrence after a given date
 */
export function getNextOccurrence(rule: string, baseDate: Date, afterDate: Date): Date | null {
  const rrule = parseRecurrenceRule(rule)
  if (!rrule) return null

  try {
    const rruleWithStart = new RRule({
      ...rrule.options,
      dtstart: baseDate,
    })

    return rruleWithStart.after(afterDate, false)
  } catch (error) {
    console.error("Failed to get next occurrence:", error)
    return null
  }
}

/**
 * Calculate the end time for an occurrence based on the original activity duration
 */
export function calculateOccurrenceEndTime(
  originalStart: Date,
  originalEnd: Date | null,
  occurrenceStart: Date
): Date | null {
  if (!originalEnd) return null
  
  const durationMinutes = differenceInMinutes(originalEnd, originalStart)
  return addMinutes(occurrenceStart, durationMinutes)
}

/**
 * Merge base activity data with instance overrides
 */
export function mergeActivityWithInstance(
  activity: any,
  instance: ActivityInstance | null,
  occurrenceDate: Date
): ExpandedActivity {
  const isEvent = activity.type === "EVENT"
  const baseStart = activity.start_at ? new Date(activity.start_at) : null
  const baseEnd = activity.end_at ? new Date(activity.end_at) : null
  const baseDue = activity.due_at ? new Date(activity.due_at) : null

  // Calculate occurrence times based on the pattern
  let occurrenceStart: Date | null = null
  let occurrenceEnd: Date | null = null
  let occurrenceDue: Date | null = null

  if (isEvent && baseStart) {
    // Preserve the time from the base event
    occurrenceStart = new Date(occurrenceDate)
    occurrenceStart.setHours(baseStart.getHours())
    occurrenceStart.setMinutes(baseStart.getMinutes())
    occurrenceStart.setSeconds(0)
    occurrenceStart.setMilliseconds(0)

    if (baseEnd) {
      occurrenceEnd = calculateOccurrenceEndTime(baseStart, baseEnd, occurrenceStart)
    }
  } else if (!isEvent && baseDue) {
    // For tasks, the due date changes with occurrence
    occurrenceDue = new Date(occurrenceDate)
    occurrenceDue.setHours(baseDue.getHours())
    occurrenceDue.setMinutes(baseDue.getMinutes())
    occurrenceDue.setSeconds(0)
    occurrenceDue.setMilliseconds(0)
  }

  // Apply instance overrides if available
  if (instance) {
    return {
      id: `${activity.id}_${format(occurrenceDate, "yyyy-MM-dd")}`,
      activityId: activity.id,
      instanceId: instance.id,
      title: activity.title,
      description: activity.description,
      type: activity.type,
      status: (instance.status as any) || activity.status,
      priority: activity.priority,
      categoryId: activity.category_id,
      isRecurring: true,
      recurrenceRule: activity.recurrence_rule,
      isAllDay: activity.is_all_day || false,
      startAt: instance.overridden_start_at 
        ? new Date(instance.overridden_start_at) 
        : occurrenceStart,
      endAt: instance.overridden_end_at 
        ? new Date(instance.overridden_end_at) 
        : occurrenceEnd,
      dueAt: instance.overridden_due_at 
        ? new Date(instance.overridden_due_at) 
        : occurrenceDue,
      occurrenceAt: occurrenceDate,
      isInstance: true,
      isCancelled: instance.is_cancelled || false,
      isOverridden: !!(
        instance.overridden_start_at || 
        instance.overridden_end_at || 
        instance.overridden_due_at ||
        instance.status
      ),
      category: activity.category,
      participants: activity.participants,
      userId: activity.user_id,
      teamId: activity.team_id,
    }
  }

  // Return virtual instance (no stored instance yet)
  return {
    id: `${activity.id}_${format(occurrenceDate, "yyyy-MM-dd")}`,
    activityId: activity.id,
    instanceId: null,
    title: activity.title,
    description: activity.description,
    type: activity.type,
    status: activity.status,
    priority: activity.priority,
    categoryId: activity.category_id,
    isRecurring: true,
    recurrenceRule: activity.recurrence_rule,
    isAllDay: activity.is_all_day || false,
    startAt: occurrenceStart,
    endAt: occurrenceEnd,
    dueAt: occurrenceDue,
    occurrenceAt: occurrenceDate,
    isInstance: true,
    isCancelled: false,
    isOverridden: false,
    category: activity.category,
    participants: activity.participants,
    userId: activity.user_id,
    teamId: activity.team_id,
  }
}

/**
 * Convert a non-recurring activity to expanded format
 */
export function convertToExpandedActivity(activity: any): ExpandedActivity {
  return {
    id: activity.id,
    activityId: activity.id,
    instanceId: null,
    title: activity.title,
    description: activity.description,
    type: activity.type,
    status: activity.status,
    priority: activity.priority,
    categoryId: activity.category_id,
    isRecurring: false,
    recurrenceRule: null,
    isAllDay: activity.is_all_day || false,
    startAt: activity.start_at ? new Date(activity.start_at) : null,
    endAt: activity.end_at ? new Date(activity.end_at) : null,
    dueAt: activity.due_at ? new Date(activity.due_at) : null,
    occurrenceAt: null,
    isInstance: false,
    isCancelled: activity.status === "CANCELLED",
    isOverridden: false,
    category: activity.category,
    participants: activity.participants,
    userId: activity.user_id,
    teamId: activity.team_id,
  }
}

/**
 * Get human-readable recurrence description
 */
export function getRecurrenceDescription(rule: string): string {
  const rrule = parseRecurrenceRule(rule)
  if (!rrule) return "Invalid recurrence"
  
  try {
    return rrule.toText()
  } catch {
    return "Custom recurrence"
  }
}

/**
 * Check if a specific date is an occurrence of a recurring activity
 */
export function isOccurrenceDate(
  rule: string, 
  baseDate: Date, 
  checkDate: Date
): boolean {
  const occurrences = expandRecurrenceOccurrences(
    rule,
    baseDate,
    startOfDay(checkDate),
    endOfDay(checkDate),
    1
  )
  return occurrences.length > 0
}

/**
 * Edit mode types for recurring activities
 */
export type RecurrenceEditMode = 
  | "this_occurrence" 
  | "this_and_future" 
  | "all_occurrences"

/**
 * Calculate the new recurrence rule when splitting at a specific occurrence
 * Returns { pastRule, futureRule }
 */
export function splitRecurrenceRule(
  originalRule: string,
  baseDate: Date,
  splitDate: Date
): { pastRule: string; futureRule: string } {
  const rrule = parseRecurrenceRule(originalRule)
  if (!rrule) {
    return { pastRule: "", futureRule: "" }
  }

  // Create rule that ends before split date
  const pastRRule = new RRule({
    ...rrule.options,
    dtstart: baseDate,
    until: new Date(splitDate.getTime() - 1), // Day before split
  })

  // Future rule starts from split date
  const futureRRule = new RRule({
    ...rrule.options,
    dtstart: splitDate,
    // Remove count if it was set, as we're splitting
    count: undefined,
  })

  return {
    pastRule: pastRRule.toString(),
    futureRule: futureRRule.toString(),
  }
}
