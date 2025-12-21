"use server"

import { createClient } from "@/lib/supabase/server"
import {
  createActivitySchema,
  updateActivitySchema,
  CreateActivityInput,
  UpdateActivityInput,
} from "@/lib/validations/activities"
import { createCategorySchema, CreateCategoryInput } from "@/lib/validations/categories"
import { revalidatePath } from "next/cache"
import { RecurrenceEditMode } from "@/types/database"
import { splitRecurrenceRule, expandRecurrenceOccurrences } from "@/lib/recurrence"
import { format, addDays } from "date-fns"

interface CreateActivityWithCategoryInput {
  activity: CreateActivityInput
  pendingCategory?: CreateCategoryInput | null
}

export async function createActivity(
  input: CreateActivityInput | CreateActivityWithCategoryInput
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Unauthorized", success: false }
    }

    // Check if input has pendingCategory (new format)
    const isPendingCategoryInput = 'activity' in input && 'pendingCategory' in input
    const activityInput = isPendingCategoryInput ? input.activity : input
    const pendingCategory = isPendingCategoryInput ? input.pendingCategory : null

    const validatedFields = createActivitySchema.safeParse(activityInput)

    if (!validatedFields.success) {
      return {
        error: "Invalid fields",
        success: false,
        details: validatedFields.error.flatten(),
      }
    }

    const { data } = validatedFields
    let categoryId = data.category_id

    // If there's a pending category, create it first
    if (pendingCategory) {
      const validatedCategory = createCategorySchema.safeParse(pendingCategory)
      if (!validatedCategory.success) {
        return {
          error: "Invalid category data",
          success: false,
          details: validatedCategory.error.flatten(),
        }
      }

      const { data: newCategory, error: categoryError } = await supabase
        .from("categories")
        .insert({ ...validatedCategory.data, user_id: user.id })
        .select()
        .single()

      if (categoryError) {
        console.error("Create category error:", categoryError)
        return { error: "Failed to create category", success: false }
      }

      categoryId = newCategory.id
      revalidatePath("/categories")
    }

    // If team_id is present, ensure user is a valid member
    if (data.team_id) {
      const { data: membership } = await supabase
        .from("team_members")
        .select("role")
        .eq("team_id", data.team_id)
        .eq("user_id", user.id)
        .eq("status", "ACCEPTED")
        .single()

      if (!membership) {
        return {
          error: "You are not a member of this team",
          success: false,
        }
      }
    }

    const { data: activity, error } = await supabase
      .from("activities")
      .insert({
        ...data,
        category_id: categoryId, // Use the new category ID if created
        user_id: user.id,
        last_updated_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error("Create activity error:", error)
      return { error: "Failed to create activity", success: false }
    }

    revalidatePath("/activities")
    return { success: true, data: activity }
  } catch (error) {
    console.error("Create activity exception:", error)
    return { error: "Internal server error", success: false }
  }
}

export async function updateActivity(input: UpdateActivityInput) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Unauthorized", success: false }
    }

    const validatedFields = updateActivitySchema.safeParse(input)

    if (!validatedFields.success) {
      return {
        error: "Invalid fields",
        success: false,
        details: validatedFields.error.flatten(),
      }
    }

    const { id, ...updates } = validatedFields.data

    // Permission Check
    // 1. Fetch existing activity
    const { data: existingActivity } = await supabase
      .from("activities")
      .select("*, participants:activity_participants(*)")
      .eq("id", id)
      .single()

    if (!existingActivity) {
      return { error: "Activity not found", success: false }
    }

    let hasPermission = false

    // Check if Creator
    if (existingActivity.user_id === user.id) {
      hasPermission = true
    }

    // Check if Team Admin (if team activity)
    if (!hasPermission && existingActivity.team_id) {
      const { data: teamMember } = await supabase
        .from("team_members")
        .select("role")
        .eq("team_id", existingActivity.team_id)
        .eq("user_id", user.id)
        .eq("status", "ACCEPTED")
        .single()

      if (teamMember && teamMember.role === "ADMIN") {
        hasPermission = true
      }
    }

    // Check if Editor in participants
    if (!hasPermission && existingActivity.participants) {
      const participant = existingActivity.participants.find(
        (p: any) => p.user_id === user.id
      )
      if (participant && participant.role === "EDITOR") {
        hasPermission = true
      }
    }

    if (!hasPermission) {
      return { error: "You do not have permission to edit this activity", success: false }
    }

    const { data: activity, error } = await supabase
      .from("activities")
      .update({
        ...updates,
        last_updated_by: user.id,
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Update activity error:", error)
      return { error: "Failed to update activity", success: false }
    }

    revalidatePath("/activities")
    return { success: true, data: activity }
  } catch (error) {
    console.error("Update activity exception:", error)
    return { error: "Internal server error", success: false }
  }
}

/**
 * Delete a non-recurring activity
 */
export async function deleteActivity(activityId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Unauthorized", success: false }
    }

    // Verify ownership
    const { data: activity } = await supabase
      .from("activities")
      .select("user_id")
      .eq("id", activityId)
      .single()

    if (!activity) {
      return { error: "Activity not found", success: false }
    }

    if (activity.user_id !== user.id) {
      return { error: "You do not have permission to delete this activity", success: false }
    }

    // Soft delete: set deleted_at timestamp
    const { error } = await supabase
      .from("activities")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", activityId)

    if (error) {
      console.error("Delete activity error:", error)
      return { error: "Failed to delete activity", success: false }
    }

    revalidatePath("/activities")
    revalidatePath("/calendar")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Delete activity exception:", error)
    return { error: "Internal server error", success: false }
  }
}

// ============================================
// RECURRING ACTIVITY MANAGEMENT
// ============================================

interface UpdateRecurringActivityInput {
  activityId: string
  occurrenceAt: Date
  editMode: RecurrenceEditMode
  updates: Partial<UpdateActivityInput>
}

/**
 * Update a recurring activity with different edit modes:
 * - this_occurrence: Only update the specific instance
 * - this_and_future: Split the series and update future occurrences
 * - all_occurrences: Update the base activity (affects all occurrences)
 */
export async function updateRecurringActivity(input: UpdateRecurringActivityInput) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Unauthorized", success: false }
    }

    const { activityId, occurrenceAt, editMode, updates } = input

    // Fetch the base activity
    const { data: activity } = await supabase
      .from("activities")
      .select("*, participants:activity_participants(*)")
      .eq("id", activityId)
      .single()

    if (!activity) {
      return { error: "Activity not found", success: false }
    }

    // Permission check
    const hasPermission = await checkActivityPermission(supabase, activity, user.id)
    if (!hasPermission) {
      return { error: "You do not have permission to edit this activity", success: false }
    }

    switch (editMode) {
      case "this_occurrence":
        return await updateSingleInstance(supabase, activityId, occurrenceAt, updates, user.id)
      
      case "this_and_future":
        return await updateThisAndFuture(supabase, activity, occurrenceAt, updates, user.id)
      
      case "all_occurrences":
        return await updateActivity({ id: activityId, ...updates } as UpdateActivityInput)
      
      default:
        return { error: "Invalid edit mode", success: false }
    }
  } catch (error) {
    console.error("Update recurring activity exception:", error)
    return { error: "Internal server error", success: false }
  }
}

/**
 * Update or create a single instance for a specific occurrence
 */
async function updateSingleInstance(
  supabase: any,
  activityId: string,
  occurrenceAt: Date,
  updates: Partial<UpdateActivityInput>,
  userId: string
) {
  // Check if instance already exists
  const occurrenceDate = format(occurrenceAt, "yyyy-MM-dd")
  
  const { data: existingInstance } = await supabase
    .from("activity_instances")
    .select("*")
    .eq("activity_id", activityId)
    .gte("occurrence_at", `${occurrenceDate}T00:00:00.000Z`)
    .lt("occurrence_at", `${occurrenceDate}T23:59:59.999Z`)
    .maybeSingle()

  // Map activity updates to instance fields
  const instanceUpdates: any = {}
  
  if (updates.start_at !== undefined) {
    instanceUpdates.overridden_start_at = updates.start_at
  }
  if (updates.end_at !== undefined) {
    instanceUpdates.overridden_end_at = updates.end_at
  }
  if (updates.due_at !== undefined) {
    instanceUpdates.overridden_due_at = updates.due_at
  }
  if (updates.status !== undefined) {
    instanceUpdates.status = updates.status
    if (updates.status === "DONE") {
      instanceUpdates.completed_at = new Date().toISOString()
    }
  }

  if (existingInstance) {
    // Update existing instance
    const { data: instance, error } = await supabase
      .from("activity_instances")
      .update({
        ...instanceUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingInstance.id)
      .select()
      .single()

    if (error) {
      console.error("Update instance error:", error)
      return { error: "Failed to update instance", success: false }
    }

    revalidatePath("/activities")
    revalidatePath("/calendar")
    return { success: true, data: instance }
  } else {
    // Create new instance
    const { data: instance, error } = await supabase
      .from("activity_instances")
      .insert({
        activity_id: activityId,
        occurrence_at: occurrenceAt.toISOString(),
        ...instanceUpdates,
      })
      .select()
      .single()

    if (error) {
      console.error("Create instance error:", error)
      return { error: "Failed to create instance", success: false }
    }

    revalidatePath("/activities")
    revalidatePath("/calendar")
    return { success: true, data: instance }
  }
}

/**
 * Split the recurring series and update this and future occurrences
 */
async function updateThisAndFuture(
  supabase: any,
  activity: any,
  splitDate: Date,
  updates: Partial<UpdateActivityInput>,
  userId: string
) {
  if (!activity.recurrence_rule || !activity.is_recurring) {
    return { error: "Activity is not recurring", success: false }
  }

  const baseDate = activity.type === "EVENT" 
    ? new Date(activity.start_at!) 
    : new Date(activity.due_at!)

  // Split the recurrence rule
  const { pastRule, futureRule } = splitRecurrenceRule(
    activity.recurrence_rule,
    baseDate,
    splitDate
  )

  // Update the original activity to end before split date
  const { error: updateError } = await supabase
    .from("activities")
    .update({
      recurrence_rule: pastRule,
      last_updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", activity.id)

  if (updateError) {
    console.error("Update original activity error:", updateError)
    return { error: "Failed to split series", success: false }
  }

  // Create new activity for future occurrences with updates
  const newActivityData = {
    title: updates.title || activity.title,
    description: updates.description !== undefined ? updates.description : activity.description,
    type: activity.type,
    status: updates.status || activity.status,
    priority: updates.priority || activity.priority,
    category_id: updates.category_id !== undefined ? updates.category_id : activity.category_id,
    team_id: activity.team_id,
    user_id: activity.user_id,
    is_recurring: true,
    recurrence_rule: futureRule,
    is_all_day: activity.is_all_day,
    start_at: updates.start_at || (activity.type === "EVENT" ? splitDate.toISOString() : null),
    end_at: updates.end_at || activity.end_at,
    due_at: updates.due_at || (activity.type === "TASK" ? splitDate.toISOString() : null),
    parent_id: activity.id, // Link to original series
    last_updated_by: userId,
  }

  const { data: newActivity, error: createError } = await supabase
    .from("activities")
    .insert(newActivityData)
    .select()
    .single()

  if (createError) {
    console.error("Create new activity error:", createError)
    return { error: "Failed to create new series", success: false }
  }

  // Copy participants to new activity
  if (activity.participants?.length > 0) {
    const participantsToInsert = activity.participants.map((p: any) => ({
      activity_id: newActivity.id,
      user_id: p.user_id,
      role: p.role,
      status: p.status,
    }))

    await supabase
      .from("activity_participants")
      .insert(participantsToInsert)
  }

  revalidatePath("/activities")
  revalidatePath("/calendar")
  return { success: true, data: newActivity }
}

/**
 * Cancel a specific occurrence of a recurring activity
 */
export async function cancelRecurringInstance(
  activityId: string,
  occurrenceAt: Date
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Unauthorized", success: false }
    }

    // Check permission
    const { data: activity } = await supabase
      .from("activities")
      .select("*, participants:activity_participants(*)")
      .eq("id", activityId)
      .single()

    if (!activity) {
      return { error: "Activity not found", success: false }
    }

    const hasPermission = await checkActivityPermission(supabase, activity, user.id)
    if (!hasPermission) {
      return { error: "You do not have permission", success: false }
    }

    // Check if instance exists
    const occurrenceDate = format(occurrenceAt, "yyyy-MM-dd")
    
    const { data: existingInstance } = await supabase
      .from("activity_instances")
      .select("*")
      .eq("activity_id", activityId)
      .gte("occurrence_at", `${occurrenceDate}T00:00:00.000Z`)
      .lt("occurrence_at", `${occurrenceDate}T23:59:59.999Z`)
      .maybeSingle()

    if (existingInstance) {
      // Update existing instance to cancelled
      const { error } = await supabase
        .from("activity_instances")
        .update({ is_cancelled: true, updated_at: new Date().toISOString() })
        .eq("id", existingInstance.id)

      if (error) {
        return { error: "Failed to cancel instance", success: false }
      }
    } else {
      // Create cancelled instance
      const { error } = await supabase
        .from("activity_instances")
        .insert({
          activity_id: activityId,
          occurrence_at: occurrenceAt.toISOString(),
          is_cancelled: true,
        })

      if (error) {
        return { error: "Failed to cancel instance", success: false }
      }
    }

    revalidatePath("/activities")
    revalidatePath("/calendar")
    return { success: true }
  } catch (error) {
    console.error("Cancel instance exception:", error)
    return { error: "Internal server error", success: false }
  }
}

/**
 * Delete entire recurring series
 */
export async function deleteRecurringSeries(activityId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Unauthorized", success: false }
    }

    const { data: activity } = await supabase
      .from("activities")
      .select("*, participants:activity_participants(*)")
      .eq("id", activityId)
      .single()

    if (!activity) {
      return { error: "Activity not found", success: false }
    }

    const hasPermission = await checkActivityPermission(supabase, activity, user.id)
    if (!hasPermission) {
      return { error: "You do not have permission", success: false }
    }

    // Soft delete the activity
    const { error } = await supabase
      .from("activities")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", activityId)

    if (error) {
      return { error: "Failed to delete series", success: false }
    }

    revalidatePath("/activities")
    revalidatePath("/calendar")
    return { success: true }
  } catch (error) {
    console.error("Delete series exception:", error)
    return { error: "Internal server error", success: false }
  }
}

/**
 * Delete this and all future occurrences
 */
export async function deleteThisAndFuture(
  activityId: string,
  fromDate: Date
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Unauthorized", success: false }
    }

    const { data: activity } = await supabase
      .from("activities")
      .select("*, participants:activity_participants(*)")
      .eq("id", activityId)
      .single()

    if (!activity) {
      return { error: "Activity not found", success: false }
    }

    const hasPermission = await checkActivityPermission(supabase, activity, user.id)
    if (!hasPermission) {
      return { error: "You do not have permission", success: false }
    }

    if (!activity.recurrence_rule) {
      return { error: "Activity is not recurring", success: false }
    }

    const baseDate = activity.type === "EVENT" 
      ? new Date(activity.start_at!) 
      : new Date(activity.due_at!)

    // Split to get only the past rule
    const { pastRule } = splitRecurrenceRule(
      activity.recurrence_rule,
      baseDate,
      fromDate
    )

    // Update with past rule only (effectively ending the series)
    const { error } = await supabase
      .from("activities")
      .update({
        recurrence_rule: pastRule || null,
        is_recurring: !!pastRule,
        last_updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", activityId)

    if (error) {
      return { error: "Failed to update series", success: false }
    }

    revalidatePath("/activities")
    revalidatePath("/calendar")
    return { success: true }
  } catch (error) {
    console.error("Delete this and future exception:", error)
    return { error: "Internal server error", success: false }
  }
}

// ============================================
// ACTIVITY COMMENTS
// ============================================

interface CreateCommentInput {
  activityId: string
  instanceId?: string | null
  content: string
  parentCommentId?: string | null
}

/**
 * Create a comment on an activity or specific instance
 */
export async function createActivityComment(input: CreateCommentInput) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Unauthorized", success: false }
    }

    const { activityId, instanceId, content, parentCommentId } = input

    if (!content.trim()) {
      return { error: "Comment cannot be empty", success: false }
    }

    // Check if user has access to the activity
    const { data: activity } = await supabase
      .from("activities")
      .select("*, participants:activity_participants(*)")
      .eq("id", activityId)
      .single()

    if (!activity) {
      return { error: "Activity not found", success: false }
    }

    // Check if user is owner, team member, or participant
    let canComment = activity.user_id === user.id

    if (!canComment && activity.team_id) {
      const { data: teamMember } = await supabase
        .from("team_members")
        .select("*")
        .eq("team_id", activity.team_id)
        .eq("user_id", user.id)
        .eq("status", "ACCEPTED")
        .maybeSingle()
      
      canComment = !!teamMember
    }

    if (!canComment && activity.participants) {
      const participant = activity.participants.find(
        (p: any) => p.user_id === user.id && p.status === "ACCEPTED"
      )
      // Allow VIEWER to comment too, or require COMMENTER/EDITOR role
      canComment = !!participant && ["COMMENTER", "EDITOR"].includes(participant.role)
    }

    if (!canComment) {
      return { error: "You do not have permission to comment", success: false }
    }

    const { data: comment, error } = await supabase
      .from("activity_comments")
      .insert({
        activity_id: activityId,
        activity_instance_id: instanceId || null,
        user_id: user.id,
        content: content.trim(),
        parent_comment_id: parentCommentId || null,
      })
      .select(`
        *,
        user:users(id, full_name, avatar_url)
      `)
      .single()

    if (error) {
      console.error("Create comment error:", error)
      return { error: "Failed to create comment", success: false }
    }

    return { success: true, data: comment }
  } catch (error) {
    console.error("Create comment exception:", error)
    return { error: "Internal server error", success: false }
  }
}

/**
 * Update a comment
 */
export async function updateActivityComment(
  commentId: string,
  content: string
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Unauthorized", success: false }
    }

    // Check if user owns the comment
    const { data: existingComment } = await supabase
      .from("activity_comments")
      .select("*")
      .eq("id", commentId)
      .single()

    if (!existingComment) {
      return { error: "Comment not found", success: false }
    }

    if (existingComment.user_id !== user.id) {
      return { error: "You can only edit your own comments", success: false }
    }

    const { data: comment, error } = await supabase
      .from("activity_comments")
      .update({ content: content.trim(), updated_at: new Date().toISOString() })
      .eq("id", commentId)
      .select()
      .single()

    if (error) {
      return { error: "Failed to update comment", success: false }
    }

    return { success: true, data: comment }
  } catch (error) {
    console.error("Update comment exception:", error)
    return { error: "Internal server error", success: false }
  }
}

/**
 * Delete a comment (soft delete)
 */
export async function deleteActivityComment(commentId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Unauthorized", success: false }
    }

    // Check if user owns the comment
    const { data: comment } = await supabase
      .from("activity_comments")
      .select("*")
      .eq("id", commentId)
      .single()

    if (!comment) {
      return { error: "Comment not found", success: false }
    }

    if (comment.user_id !== user.id) {
      return { error: "You can only delete your own comments", success: false }
    }

    const { error } = await supabase
      .from("activity_comments")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", commentId)

    if (error) {
      return { error: "Failed to delete comment", success: false }
    }

    return { success: true }
  } catch (error) {
    console.error("Delete comment exception:", error)
    return { error: "Internal server error", success: false }
  }
}

// ============================================
// ACTIVITY PARTICIPANTS
// ============================================

interface AddParticipantInput {
  activityId: string
  userId: string
  role?: "VIEWER" | "COMMENTER" | "EDITOR"
}

/**
 * Add a participant to an activity (applies to all instances)
 */
export async function addActivityParticipant(input: AddParticipantInput) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Unauthorized", success: false }
    }

    const { activityId, userId: participantUserId, role = "VIEWER" } = input

    // Check permission to add participants
    const { data: activity } = await supabase
      .from("activities")
      .select("*, participants:activity_participants(*)")
      .eq("id", activityId)
      .single()

    if (!activity) {
      return { error: "Activity not found", success: false }
    }

    const hasPermission = await checkActivityPermission(supabase, activity, user.id)
    if (!hasPermission) {
      return { error: "You do not have permission to add participants", success: false }
    }

    // Check if participant already exists
    const existingParticipant = activity.participants?.find(
      (p: any) => p.user_id === participantUserId
    )

    if (existingParticipant) {
      return { error: "User is already a participant", success: false }
    }

    const { data: participant, error } = await supabase
      .from("activity_participants")
      .insert({
        activity_id: activityId,
        user_id: participantUserId,
        role,
        status: "PENDING",
        invited_at: new Date().toISOString(),
      })
      .select(`
        *,
        user:users(id, full_name, avatar_url, email)
      `)
      .single()

    if (error) {
      console.error("Add participant error:", error)
      return { error: "Failed to add participant", success: false }
    }

    revalidatePath("/activities")
    return { success: true, data: participant }
  } catch (error) {
    console.error("Add participant exception:", error)
    return { error: "Internal server error", success: false }
  }
}

/**
 * Update participant role or status
 */
export async function updateParticipant(
  participantId: string,
  updates: { role?: "VIEWER" | "COMMENTER" | "EDITOR"; status?: "PENDING" | "ACCEPTED" | "DECLINED" }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Unauthorized", success: false }
    }

    const { data: participant } = await supabase
      .from("activity_participants")
      .select("*, activity:activities(*)")
      .eq("id", participantId)
      .single()

    if (!participant) {
      return { error: "Participant not found", success: false }
    }

    // Only activity owner or participant themselves can update
    const isOwner = participant.activity?.user_id === user.id
    const isSelf = participant.user_id === user.id

    // Participant can only update their own status (accept/decline)
    if (isSelf && updates.role) {
      return { error: "You cannot change your own role", success: false }
    }

    // Only owner can change roles
    if (!isOwner && updates.role) {
      return { error: "Only the owner can change participant roles", success: false }
    }

    const updateData: any = { updated_at: new Date().toISOString() }
    if (updates.role) updateData.role = updates.role
    if (updates.status) {
      updateData.status = updates.status
      if (updates.status === "ACCEPTED") {
        updateData.joined_at = new Date().toISOString()
      }
    }

    const { data: updated, error } = await supabase
      .from("activity_participants")
      .update(updateData)
      .eq("id", participantId)
      .select()
      .single()

    if (error) {
      return { error: "Failed to update participant", success: false }
    }

    revalidatePath("/activities")
    return { success: true, data: updated }
  } catch (error) {
    console.error("Update participant exception:", error)
    return { error: "Internal server error", success: false }
  }
}

/**
 * Remove a participant from an activity
 */
export async function removeParticipant(participantId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Unauthorized", success: false }
    }

    const { data: participant } = await supabase
      .from("activity_participants")
      .select("*, activity:activities(*)")
      .eq("id", participantId)
      .single()

    if (!participant) {
      return { error: "Participant not found", success: false }
    }

    // Only activity owner or participant themselves can remove
    const isOwner = participant.activity?.user_id === user.id
    const isSelf = participant.user_id === user.id

    if (!isOwner && !isSelf) {
      return { error: "You do not have permission to remove this participant", success: false }
    }

    const { error } = await supabase
      .from("activity_participants")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", participantId)

    if (error) {
      return { error: "Failed to remove participant", success: false }
    }

    revalidatePath("/activities")
    return { success: true }
  } catch (error) {
    console.error("Remove participant exception:", error)
    return { error: "Internal server error", success: false }
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if user has permission to modify an activity
 */
async function checkActivityPermission(
  supabase: any,
  activity: any,
  userId: string
): Promise<boolean> {
  // Check if Creator
  if (activity.user_id === userId) {
    return true
  }

  // Check if Team Admin (if team activity)
  if (activity.team_id) {
    const { data: teamMember } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", activity.team_id)
      .eq("user_id", userId)
      .eq("status", "ACCEPTED")
      .single()

    if (teamMember && teamMember.role === "ADMIN") {
      return true
    }
  }

  // Check if Editor in participants
  if (activity.participants) {
    const participant = activity.participants.find(
      (p: any) => p.user_id === userId
    )
    if (participant && participant.role === "EDITOR") {
      return true
    }
  }

  return false
}

/**
 * Mark instance as complete
 */
export async function completeInstance(
  activityId: string,
  occurrenceAt: Date
) {
  return updateSingleInstance(
    await createClient(),
    activityId,
    occurrenceAt,
    { status: "DONE" },
    (await (await createClient()).auth.getUser()).data.user!.id
  )
}
