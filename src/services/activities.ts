import { createClient } from "@/lib/supabase/server"
import { 
  ActivityWithParticipants, 
  ActivityInstance, 
  ActivityComment,
  CalendarActivity 
} from "@/types/database"
import {
  expandRecurrenceOccurrences,
  mergeActivityWithInstance,
  convertToExpandedActivity,
  type ExpandedActivity,
} from "@/lib/recurrence"
import { format, startOfDay, endOfDay } from "date-fns"

export async function getActivities(
  userId: string,
  dateRange?: { start: Date; end: Date }
) {
  const supabase = await createClient()

  // 1. Get Team IDs where user is a member
  const { data: teamMembers } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId)
    .eq("status", "ACCEPTED")

  const teamIds = teamMembers?.map((tm) => tm.team_id).filter(Boolean) || []

  // 2. Get Activity IDs where user is a participant
  const { data: participations } = await supabase
    .from("activity_participants")
    .select("activity_id")
    .eq("user_id", userId)
    .eq("status", "ACCEPTED")

  const participantActivityIds =
    participations?.map((p) => p.activity_id).filter(Boolean) || []

  // 3. Build the main query
  let query = supabase
    .from("activities")
    .select(`
      *,
      participants:activity_participants(*),
      category:categories(*)
    `)
    .is("deleted_at", null)

  // Construct the OR filter
  // user_id.eq.userId OR team_id.in.teamIds OR id.in.participantActivityIds
  const conditions = [`user_id.eq.${userId}`]
  
  if (teamIds.length > 0) {
    conditions.push(`team_id.in.(${teamIds.join(",")})`)
  }
  
  if (participantActivityIds.length > 0) {
    conditions.push(`id.in.(${participantActivityIds.join(",")})`)
  }

  query = query.or(conditions.join(","))

  // Date range filtering
  if (dateRange) {
    // For events: start_at or end_at overlaps with range
    // For tasks: due_at within range
    // This is complex because of different types. 
    // Simplified: fetch if any date field falls in range or if it's recurring (since we need to expand it)
    
    // For now, let's just filter by start_at/due_at if provided, 
    // but strictly speaking, we should handle the overlap logic.
    // Given the instruction "Recurrence Logic: This service must fetch the base recurring activity",
    // we should be careful not to filter out recurring events that *would* occur in this range.
    
    // If it's recurring, we fetch it regardless of date (or maybe check start_at <= range.end)
    // If it's not recurring:
    //   Task: due_at in range
    //   Event: overlaps range
    
    // To keep it simple and performant for now, we might fetch a bit more and filter in memory if needed,
    // or just apply basic bounds.
    // Let's apply a loose filter: 
    // (start_at <= end AND (end_at >= start OR end_at is null)) OR due_at between start and end OR is_recurring = true
    
    const startIso = dateRange.start.toISOString()
    const endIso = dateRange.end.toISOString()
    
    query = query.or(`is_recurring.eq.true,and(start_at.lte.${endIso},or(end_at.gte.${startIso},end_at.is.null)),and(due_at.gte.${startIso},due_at.lte.${endIso})`)
  }

  const { data, error } = await query.order("start_at", { ascending: true })

  if (error) {
    console.error("Error fetching activities:", error)
    return []
  }

  return data as ActivityWithParticipants[]
}

export async function getActivityById(activityId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("activities")
    .select(`
      *,
      participants:activity_participants(*),
      comments:activity_comments(*),
      instances:activity_instances(*)
    `)
    .eq("id", activityId)
    .single()

  if (error) {
    console.error("Error fetching activity:", error)
    return null
  }

  return data as ActivityWithParticipants & { 
    comments: ActivityComment[]
    instances: ActivityInstance[]
  }
}

/**
 * Get activity instances for a recurring activity within a date range
 */
export async function getActivityInstances(
  activityId: string,
  dateRange?: { start: Date; end: Date }
) {
  const supabase = await createClient()

  let query = supabase
    .from("activity_instances")
    .select("*")
    .eq("activity_id", activityId)
    .is("deleted_at", null)

  if (dateRange) {
    query = query
      .gte("occurrence_at", dateRange.start.toISOString())
      .lte("occurrence_at", dateRange.end.toISOString())
  }

  const { data, error } = await query.order("occurrence_at", { ascending: true })

  if (error) {
    console.error("Error fetching activity instances:", error)
    return []
  }

  return data as ActivityInstance[]
}

/**
 * Get a specific instance by occurrence date
 */
export async function getActivityInstanceByDate(
  activityId: string,
  occurrenceAt: Date
) {
  const supabase = await createClient()

  // Use date string for comparison (to handle timezone properly)
  const occurrenceDate = format(occurrenceAt, "yyyy-MM-dd")
  
  const { data, error } = await supabase
    .from("activity_instances")
    .select("*")
    .eq("activity_id", activityId)
    .gte("occurrence_at", `${occurrenceDate}T00:00:00.000Z`)
    .lt("occurrence_at", `${occurrenceDate}T23:59:59.999Z`)
    .is("deleted_at", null)
    .maybeSingle()

  if (error) {
    console.error("Error fetching activity instance:", error)
    return null
  }

  return data as ActivityInstance | null
}

/**
 * Get expanded activities for calendar view
 * This handles both recurring and non-recurring activities
 */
export async function getExpandedActivities(
  userId: string,
  dateRange: { start: Date; end: Date }
): Promise<CalendarActivity[]> {
  const supabase = await createClient()
  
  // Get base activities
  const activities = await getActivities(userId)
  if (!activities.length) return []

  const expandedActivities: CalendarActivity[] = []

  // Get all instances for recurring activities in the date range
  const recurringActivityIds = activities
    .filter(a => a.is_recurring && a.recurrence_rule)
    .map(a => a.id)

  let instancesMap: Map<string, ActivityInstance[]> = new Map()

  if (recurringActivityIds.length > 0) {
    const { data: instances } = await supabase
      .from("activity_instances")
      .select("*")
      .in("activity_id", recurringActivityIds)
      .gte("occurrence_at", dateRange.start.toISOString())
      .lte("occurrence_at", dateRange.end.toISOString())
      .is("deleted_at", null)

    if (instances) {
      instances.forEach((inst: ActivityInstance) => {
        const existing = instancesMap.get(inst.activity_id!) || []
        existing.push(inst)
        instancesMap.set(inst.activity_id!, existing)
      })
    }
  }

  for (const activity of activities) {
    if (activity.is_recurring && activity.recurrence_rule) {
      // Expand recurring activity
      const baseDate = activity.type === "EVENT" 
        ? new Date(activity.start_at!) 
        : new Date(activity.due_at!)

      const occurrences = expandRecurrenceOccurrences(
        activity.recurrence_rule,
        baseDate,
        dateRange.start,
        dateRange.end
      )

      const activityInstances = instancesMap.get(activity.id) || []

      for (const occurrence of occurrences) {
        // Find matching instance for this occurrence
        const instance = activityInstances.find(inst => {
          const instDate = new Date(inst.occurrence_at)
          return format(instDate, "yyyy-MM-dd") === format(occurrence, "yyyy-MM-dd")
        })

        // Skip cancelled instances
        if (instance?.is_cancelled) continue

        const expanded = mergeActivityWithInstance(activity, instance || null, occurrence)
        expandedActivities.push(toCalendarActivity(expanded))
      }
    } else {
      // Non-recurring activity - check if it falls within the date range
      const activityDate = activity.type === "EVENT" 
        ? activity.start_at 
        : activity.due_at

      if (activityDate) {
        const date = new Date(activityDate)
        if (date >= dateRange.start && date <= dateRange.end) {
          const expanded = convertToExpandedActivity(activity)
          expandedActivities.push(toCalendarActivity(expanded))
        }
      }
    }
  }

  return expandedActivities
}

/**
 * Convert ExpandedActivity to CalendarActivity
 */
function toCalendarActivity(expanded: ExpandedActivity): CalendarActivity {
  return {
    id: expanded.id,
    activityId: expanded.activityId,
    instanceId: expanded.instanceId,
    title: expanded.title || "",
    description: expanded.description,
    type: expanded.type,
    status: expanded.status,
    priority: expanded.priority,
    categoryId: expanded.categoryId,
    isRecurring: expanded.isRecurring,
    recurrenceRule: expanded.recurrenceRule,
    isAllDay: expanded.isAllDay,
    startAt: expanded.startAt,
    endAt: expanded.endAt,
    dueAt: expanded.dueAt,
    occurrenceAt: expanded.occurrenceAt,
    isInstance: expanded.isInstance,
    isCancelled: expanded.isCancelled,
    isOverridden: expanded.isOverridden,
    category: expanded.category,
    participants: expanded.participants,
    userId: expanded.userId,
    teamId: expanded.teamId,
  }
}

/**
 * Get comments for an activity or specific instance
 */
export async function getActivityComments(
  activityId: string,
  instanceId?: string | null
) {
  const supabase = await createClient()

  let query = supabase
    .from("activity_comments")
    .select(`
      *,
      user:users(id, full_name, avatar_url)
    `)
    .eq("activity_id", activityId)
    .is("deleted_at", null)

  // If instanceId is provided, get instance-specific comments
  // Otherwise, get general activity comments (where instance_id is null)
  if (instanceId) {
    query = query.or(`activity_instance_id.eq.${instanceId},activity_instance_id.is.null`)
  } else {
    query = query.is("activity_instance_id", null)
  }

  const { data, error } = await query.order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching comments:", error)
    return []
  }

  return data
}

/**
 * Get activity with full details including instances and comments
 */
export async function getActivityWithDetails(
  activityId: string,
  occurrenceAt?: Date
) {
  const supabase = await createClient()

  // Get base activity
  const { data: activity, error } = await supabase
    .from("activities")
    .select(`
      *,
      participants:activity_participants(
        *,
        user:users(id, full_name, avatar_url, email)
      ),
      category:categories(*)
    `)
    .eq("id", activityId)
    .single()

  if (error || !activity) {
    console.error("Error fetching activity:", error)
    return null
  }

  // If occurrence date is provided, get the specific instance
  let instance: ActivityInstance | null = null
  if (occurrenceAt && activity.is_recurring) {
    instance = await getActivityInstanceByDate(activityId, occurrenceAt)
  }

  // Get comments (for the specific instance if applicable)
  const comments = await getActivityComments(activityId, instance?.id)

  return {
    activity,
    instance,
    comments,
    isExpanded: !!occurrenceAt && activity.is_recurring,
    occurrenceAt,
  }
}
