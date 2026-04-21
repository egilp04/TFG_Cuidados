export interface TimeModel {
  id_horario?: string;
  dia_semana: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | undefined;
  hora: string;
  id_admin: string;
}
