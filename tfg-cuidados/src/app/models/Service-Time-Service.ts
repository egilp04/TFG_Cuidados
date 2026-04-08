export interface ServicioAnidado {
    nombre: string;
    tipo_servicio: string;
  }
  
  export interface HorarioAnidado {
    hora: string;
    dia_semana: string;
  }
  
  export interface ServicioHorarioJoined extends Servicio_HorarioModel {
    Servicio?: ServicioAnidado;
    Horario?: HorarioAnidado;
  }