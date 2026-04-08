export interface ContractStats {
    activos: number;
    cancelados: number;
  }
  
  export interface RegistroFechaResponse {
    fecha_registro: string;
  }
  
  export interface EstadoContratoResponse {
    estado:  'activo' | 'no activo';
  }