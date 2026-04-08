export interface ContratoModel {
  id_contrato?: number;
  estado: 'activo' | 'no activo';
  fecha_inicio: string;
  fecha_fin: string | null;
  dia_semana_contratado: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes';
  hora_contratada: string;
  id_servicio_horario: string;
  fecha_creacion: string;
  id_cliente: string;
  id_empresa: string;
}

export interface SupabaseContratoJoin {
  id_contrato: string;
  estado: string;
  id_cliente: string;
  id_empresa: string;
  fecha_creacion?: string;
  fecha_fin?: string;
  id_servicio_horario?: {
    id_servicio_horario?: string;
    Servicio?: { nombre?: string };
  };
  Cliente?: {
    nombre?: string;
    direccion?: string;
    localidad?: string;
    codpostal?: string;
    Usuario?: { nombre?: string; email?: string };
  };
  Empresa?: {
    nombre?: string;
    Usuario?: { nombre?: string; email?: string };
  };
  [key: string]: unknown;
}
export interface ContratoDetalle extends ContratoModel {
  id_sh_plano?: string;
  nombreServicio?: string;
  Cliente?: {
    direccion?: string;
    localidad?: string;
    codpostal?: string;
    nombreDelCliente: string;
  };
  Empresa?: {
    nombreDeLaEmpresa: string;
  };
}