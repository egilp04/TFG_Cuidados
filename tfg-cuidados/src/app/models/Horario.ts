export interface HorarioModel {
  id_horario?: string;
  dia_semana: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes';
  hora: string;
  id_admin: string;
}
