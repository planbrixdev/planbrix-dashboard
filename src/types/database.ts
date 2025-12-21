export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      activities: {
        Row: {
          id: string
          created_at: string
          updated_at: string | null
          deleted_at: string | null
          user_id: string | null
          title: string | null
          description: string | null
          start_at: string | null
          due_at: string | null
          end_at: string | null
          type: "TASK" | "EVENT" | null
          status: "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED" | null
          priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | null
          category_id: string | null
          is_active: boolean | null
          recurrence_rule: string | null
          parent_id: string | null
          is_recurring: boolean | null
          is_all_day: boolean | null
          is_shared: boolean | null
          team_id: string | null
          last_updated_by: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string | null
          deleted_at?: string | null
          user_id?: string | null
          title?: string | null
          description?: string | null
          start_at?: string | null
          due_at?: string | null
          end_at?: string | null
          type?: "TASK" | "EVENT" | null
          status?: "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED" | null
          priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | null
          category_id?: string | null
          is_active?: boolean | null
          recurrence_rule?: string | null
          parent_id?: string | null
          is_recurring?: boolean | null
          is_all_day?: boolean | null
          is_shared?: boolean | null
          team_id?: string | null
          last_updated_by?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string | null
          deleted_at?: string | null
          user_id?: string | null
          title?: string | null
          description?: string | null
          start_at?: string | null
          due_at?: string | null
          end_at?: string | null
          type?: "TASK" | "EVENT" | null
          status?: "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED" | null
          priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | null
          category_id?: string | null
          is_active?: boolean | null
          recurrence_rule?: string | null
          parent_id?: string | null
          is_recurring?: boolean | null
          is_all_day?: boolean | null
          is_shared?: boolean | null
          team_id?: string | null
          last_updated_by?: string | null
        }
      }
      activity_participants: {
        Row: {
          id: string
          created_at: string
          updated_at: string | null
          deleted_at: string | null
          activity_id: string | null
          user_id: string | null
          role: "VIEWER" | "COMMENTER" | "EDITOR" | null
          status: "PENDING" | "ACCEPTED" | "DECLINED" | null
          invited_at: string | null
          joined_at: string | null
          custom_color: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string | null
          deleted_at?: string | null
          activity_id?: string | null
          user_id?: string | null
          role?: "VIEWER" | "COMMENTER" | "EDITOR" | null
          status?: "PENDING" | "ACCEPTED" | "DECLINED" | null
          invited_at?: string | null
          joined_at?: string | null
          custom_color?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string | null
          deleted_at?: string | null
          activity_id?: string | null
          user_id?: string | null
          role?: "VIEWER" | "COMMENTER" | "EDITOR" | null
          status?: "PENDING" | "ACCEPTED" | "DECLINED" | null
          invited_at?: string | null
          joined_at?: string | null
          custom_color?: string | null
        }
      }
      categories: {
        Row: {
          id: string
          created_at: string
          updated_at: string | null
          deleted_at: string | null
          user_id: string | null
          name: string | null
          description: string | null
          color: string | null
          icon: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string | null
          deleted_at?: string | null
          user_id?: string | null
          name?: string | null
          description?: string | null
          color?: string | null
          icon?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string | null
          deleted_at?: string | null
          user_id?: string | null
          name?: string | null
          description?: string | null
          color?: string | null
          icon?: string | null
        }
      }
      // Add other tables if needed, but these are the core for now
    }
  }
}

export type Activity = Database["public"]["Tables"]["activities"]["Row"]
export type ActivityParticipant = Database["public"]["Tables"]["activity_participants"]["Row"]
export type Category = Database["public"]["Tables"]["categories"]["Row"]

export interface ActivityWithParticipants extends Activity {
  participants: ActivityParticipant[]
  category?: Category | null
}

// Activity Instance Types
export interface ActivityInstance {
  id: string
  created_at: string
  updated_at: string | null
  deleted_at: string | null
  activity_id: string | null
  occurrence_at: string
  status: "TODO" | "IN_PROGRESS" | "DONE" | null
  overridden_start_at: string | null
  overridden_end_at: string | null
  overridden_due_at: string | null
  completed_at: string | null
  is_cancelled: boolean | null
}

// Activity Comment Types
export interface ActivityComment {
  id: string
  created_at: string
  updated_at: string | null
  deleted_at: string | null
  activity_id: string | null
  user_id: string | null
  content: string | null
  parent_comment_id: string | null
  activity_instance_id: string | null
}

// Extended types for full data
export interface ActivityWithInstances extends ActivityWithParticipants {
  instances?: ActivityInstance[]
  comments?: ActivityComment[]
}

// Calendar display types
export interface CalendarActivity {
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
  category?: Category | null
  participants?: ActivityParticipant[]
  userId?: string | null
  teamId?: string | null
}

// Recurrence edit mode
export type RecurrenceEditMode = 
  | "this_occurrence" 
  | "this_and_future" 
  | "all_occurrences"
