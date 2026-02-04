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
