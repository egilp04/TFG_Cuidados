export interface ServicioDetalle {
  nombre: string;
  tipo_servicio: string;
  id_servicio: string;
}

export interface HorarioDetalle {
  dia_semana: string;
  hora: string;
}

export interface ServicioHorarioResponse {
  id_servicio_horario: string;
  precio: number;
  descripcion?: string;
  Servicio?: ServicioDetalle;
  Horario?: HorarioDetalle;
}

export interface SupabaseEmpresaJoin {
  id_empresa: string;
  cif?: string;
  direccion?: string;
  localidad?: string;
  codpostal?: string;
  comunidad?: string;
  telef?: string;
  descripcion?: string;
  Usuario?: {
    nombre: string;
    email: string;
    estado: boolean;
  };
  Servicio_Horario?: ServicioHorarioResponse[];
  [key: string]: unknown;
}

export interface EmpresaModel {
  id_empresa: string;
  nombre: string;
  email: string;
  cif?: string;
  direccion?: string;
  localidad?: string;
  codpostal?: string;
  comunidad?: string;
  telef?: string;
  descripcion?: string;
  Servicio_Horario: ServicioHorarioResponse[];
}
