export interface Contractmodel {
  id_contrato: string;
  fecha_inicio: string | Date;
  fecha_fin?: string | Date | null;
  dia_semana_contratado?: string;
  hora_contratada?: string;
  nombreServicio?: string;
  Empresa?: {
    nombreDeLaEmpresa?: string;
  };
  Cliente?: {
    nombreDelCliente?: string;
    direccion?: string;
    localidad?: string;
    codpostal?: string;
  };
}

export interface FilaTablaContrato extends Contractmodel {
  nombreAMostrar: string;
  lugar: string;
}
