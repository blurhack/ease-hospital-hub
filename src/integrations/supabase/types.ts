export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      analytics_logs: {
        Row: {
          action_type: string
          id: string
          performed_at: string
          performed_by: string
          query: string
          record_id: string | null
          table_name: string
        }
        Insert: {
          action_type: string
          id?: string
          performed_at?: string
          performed_by: string
          query: string
          record_id?: string | null
          table_name: string
        }
        Update: {
          action_type?: string
          id?: string
          performed_at?: string
          performed_by?: string
          query?: string
          record_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          created_at: string
          date: string
          doctor_id: string
          id: string
          patient_id: string
          reason: string | null
          status: string
          time: string
        }
        Insert: {
          created_at?: string
          date: string
          doctor_id: string
          id?: string
          patient_id: string
          reason?: string | null
          status: string
          time: string
        }
        Update: {
          created_at?: string
          date?: string
          doctor_id?: string
          id?: string
          patient_id?: string
          reason?: string | null
          status?: string
          time?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          amount: number
          created_at: string
          date: string
          id: string
          items: Json
          patient_id: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          date?: string
          id?: string
          items: Json
          patient_id: string
          status: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          items?: Json
          patient_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "bills_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          availability: string
          contact: string
          created_at: string
          email: string
          experience: number
          id: string
          name: string
          qualification: string
          specialization: string
        }
        Insert: {
          availability: string
          contact: string
          created_at?: string
          email: string
          experience: number
          id?: string
          name: string
          qualification: string
          specialization: string
        }
        Update: {
          availability?: string
          contact?: string
          created_at?: string
          email?: string
          experience?: number
          id?: string
          name?: string
          qualification?: string
          specialization?: string
        }
        Relationships: []
      }
      medications: {
        Row: {
          created_at: string
          dosage: string
          id: string
          name: string
          price: number
          stock: number
          type: string
        }
        Insert: {
          created_at?: string
          dosage: string
          id?: string
          name: string
          price: number
          stock: number
          type: string
        }
        Update: {
          created_at?: string
          dosage?: string
          id?: string
          name?: string
          price?: number
          stock?: number
          type?: string
        }
        Relationships: []
      }
      patient_medications: {
        Row: {
          created_at: string
          doctor_id: string
          dosage: string
          end_date: string | null
          id: string
          instructions: string | null
          medication_id: string
          patient_id: string
          start_date: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          dosage: string
          end_date?: string | null
          id?: string
          instructions?: string | null
          medication_id: string
          patient_id: string
          start_date: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          dosage?: string
          end_date?: string | null
          id?: string
          instructions?: string | null
          medication_id?: string
          patient_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_medications_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_medications_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_medications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string
          age: number
          assigned_doctor_id: string | null
          blood_group: string
          contact: string
          created_at: string
          email: string
          gender: string
          id: string
          last_visit: string | null
          medical_history: string | null
          name: string
        }
        Insert: {
          address: string
          age: number
          assigned_doctor_id?: string | null
          blood_group: string
          contact: string
          created_at?: string
          email: string
          gender: string
          id?: string
          last_visit?: string | null
          medical_history?: string | null
          name: string
        }
        Update: {
          address?: string
          age?: number
          assigned_doctor_id?: string | null
          blood_group?: string
          contact?: string
          created_at?: string
          email?: string
          gender?: string
          id?: string
          last_visit?: string | null
          medical_history?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_assigned_doctor_id_fkey"
            columns: ["assigned_doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          capacity: number
          created_at: string
          current_patients: number | null
          floor: number
          id: string
          number: string
          price: number
          status: string
          type: string
        }
        Insert: {
          capacity: number
          created_at?: string
          current_patients?: number | null
          floor: number
          id?: string
          number: string
          price: number
          status: string
          type: string
        }
        Update: {
          capacity?: number
          created_at?: string
          current_patients?: number | null
          floor?: number
          id?: string
          number?: string
          price?: number
          status?: string
          type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
