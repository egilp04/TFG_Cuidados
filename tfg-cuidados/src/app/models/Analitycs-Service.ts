export interface ContractStats {
  activeContract: number;
  cancelContract: number;
}

export interface RegistroFechaResponse {
  fecha_registro: string;
}

export interface EstadoContratoResponse {
  estado: 'activo' | 'no activo';
}
