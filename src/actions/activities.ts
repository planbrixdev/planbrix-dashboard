"use server"

import { createClient } from "@/lib/supabase/server"
import {
  createActivitySchema,
  updateActivitySchema,
  CreateActivityInput,
  UpdateActivityInput,
} from "@/lib/validations/activities"
import { revalidatePath } from "next/cache"

export async function createActivity(input: CreateActivityInput) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Unauthorized", success: false }
    }

    const validatedFields = createActivitySchema.safeParse(input)

    if (!validatedFields.success) {
      return {
        error: "Invalid fields",
        success: false,
        details: validatedFields.error.flatten(),
      }
    }

    const { data } = validatedFields

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
