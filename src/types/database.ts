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
      configuracion_pago: {
        Row: {
          id: string
          banco_nombre: string
          numero_cuenta: string
          clabe: string | null
          beneficiario: string
          instrucciones: string | null
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          banco_nombre: string
          numero_cuenta: string
          clabe?: string | null
          beneficiario: string
          instrucciones?: string | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          banco_nombre?: string
          numero_cuenta?: string
          clabe?: string | null
          beneficiario?: string
          instrucciones?: string | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      planes: {
        Row: {
          id: string
          nombre: string
          descripcion: string | null
          precio_mensual: number
          max_productos: number | null
          max_categorias: number | null
          max_mesas: number | null
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nombre: string
          descripcion?: string | null
          precio_mensual: number
          max_productos?: number | null
          max_categorias?: number | null
          max_mesas?: number | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          descripcion?: string | null
          precio_mensual?: number
          max_productos?: number | null
          max_categorias?: number | null
          max_mesas?: number | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      negocios: {
        Row: {
          id: string
          nombre: string
          slug: string
          logo_url: string | null
          direccion: string | null
          telefono: string | null
          email: string | null
          owner_email: string
          plan_id: string | null
          estado: string
          fecha_vencimiento: string | null
          configuracion: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nombre: string
          slug: string
          logo_url?: string | null
          direccion?: string | null
          telefono?: string | null
          email?: string | null
          owner_email: string
          plan_id?: string | null
          estado?: string
          fecha_vencimiento?: string | null
          configuracion?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          slug?: string
          logo_url?: string | null
          direccion?: string | null
          telefono?: string | null
          email?: string | null
          owner_email?: string
          plan_id?: string | null
          estado?: string
          fecha_vencimiento?: string | null
          configuracion?: Json
          created_at?: string
          updated_at?: string
        }
      }
      pagos: {
        Row: {
          id: string
          negocio_id: string
          plan_id: string | null
          monto: number
          comprobante_url: string | null
          estado: string
          fecha_pago: string
          notas: string | null
          revisado_por: string | null
          fecha_revision: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          negocio_id: string
          plan_id?: string | null
          monto: number
          comprobante_url?: string | null
          estado?: string
          fecha_pago?: string
          notas?: string | null
          revisado_por?: string | null
          fecha_revision?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          negocio_id?: string
          plan_id?: string | null
          monto?: number
          comprobante_url?: string | null
          estado?: string
          fecha_pago?: string
          notas?: string | null
          revisado_por?: string | null
          fecha_revision?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ordenes: {
        Row: {
          id: string
          negocio_id: string
          mesa_numero: number | null
          nombre_cliente: string | null
          estado: string
          total: number
          notas: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          negocio_id: string
          mesa_numero?: number | null
          nombre_cliente?: string | null
          estado?: string
          total: number
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          negocio_id?: string
          mesa_numero?: number | null
          nombre_cliente?: string | null
          estado?: string
          total?: number
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ordenes_productos: {
        Row: {
          id: string
          orden_id: string
          producto_id: string | null
          nombre_producto: string
          precio_unitario: number
          cantidad: number
          subtotal: number
        }
        Insert: {
          id?: string
          orden_id: string
          producto_id?: string | null
          nombre_producto: string
          precio_unitario: number
          cantidad: number
          subtotal: number
        }
        Update: {
          id?: string
          orden_id?: string
          producto_id?: string | null
          nombre_producto?: string
          precio_unitario?: number
          cantidad?: number
          subtotal?: number
        }
      }
      mesas: {
        Row: {
          id: string
          negocio_id: string
          numero: number
          nombre: string | null
          codigo_qr: string | null
          activa: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          negocio_id: string
          numero: number
          nombre?: string | null
          codigo_qr?: string | null
          activa?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          negocio_id?: string
          numero?: number
          nombre?: string | null
          codigo_qr?: string | null
          activa?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      categorias: {
        Row: {
          id: string
          negocio_id: string
          nombre: string
          descripcion: string | null
          orden: number
          activa: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          negocio_id: string
          nombre: string
          descripcion?: string | null
          orden?: number
          activa?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          negocio_id?: string
          nombre?: string
          descripcion?: string | null
          orden?: number
          activa?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      productos: {
        Row: {
          id: string
          negocio_id: string
          categoria_id: string | null
          nombre: string
          descripcion: string | null
          precio: number
          imagen_url: string | null
          disponible: boolean
          destacado: boolean
          ingredientes: string[] | null
          alergenos: string[] | null
          orden: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          negocio_id: string
          categoria_id?: string | null
          nombre: string
          descripcion?: string | null
          precio: number
          imagen_url?: string | null
          disponible?: boolean
          destacado?: boolean
          ingredientes?: string[] | null
          alergenos?: string[] | null
          orden?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          negocio_id?: string
          categoria_id?: string | null
          nombre?: string
          descripcion?: string | null
          precio?: number
          imagen_url?: string | null
          disponible?: boolean
          destacado?: boolean
          ingredientes?: string[] | null
          alergenos?: string[] | null
          orden?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      aprobar_pago: {
        Args: {
          pago_id: string
          admin_id: string
        }
        Returns: void
      }
      rechazar_pago: {
        Args: {
          pago_id: string
          admin_id: string
          motivo?: string
        }
        Returns: void
      }
      activar_licencia: {
        Args: {
          negocio_id: string
          meses?: number
        }
        Returns: void
      }
      renovar_licencia: {
        Args: {
          negocio_id: string
          meses?: number
        }
        Returns: void
      }
      validar_negocio_activo: {
        Args: {
          slug_param: string
        }
        Returns: {
          es_valido: boolean
          negocio_id: string
          nombre: string
          estado_actual: string
          dias_restantes: number
        }[]
      }
      get_dashboard_stats: {
        Args: Record<string, never>
        Returns: Json
      }
      admin_list_users: {
        Args: Record<string, never>
        Returns: {
          id: string
          email: string
          created_at: string
        }[]
      }
      admin_create_user: {
        Args: {
          p_email: string
          p_password: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
