import { createClient } from "@/lib/supabase/server"
import { ActivityWithParticipants } from "@/types/database"

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
      participants:activity_participants(*)
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
      comments:activity_comments(*)
    `)
    .eq("id", activityId)
    .single()

  if (error) {
    console.error("Error fetching activity:", error)
    return null
  }

  return data as ActivityWithParticipants // & { comments: ... }
}
