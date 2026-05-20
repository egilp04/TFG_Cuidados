export interface TimeModel {
  id_time?: string;
  week_day: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | undefined;
  time: string;
  id_admin: string;
  status?: 'active' | 'inactive';
}
