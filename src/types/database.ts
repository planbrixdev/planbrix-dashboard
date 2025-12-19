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

export interface ActivityWithParticipants extends Activity {
  participants: ActivityParticipant[]
}
