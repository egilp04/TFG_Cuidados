export interface ContractStats {
  activeContract: number;
  cancelContract: number;
}

export interface RegistroFechaResponse {
  register_date: string;
}

export interface EstadoContratoResponse {
  state: 'activo' | 'no activo';
}
