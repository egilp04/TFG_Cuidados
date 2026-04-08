export interface RegisterPayload {
  email: string;
  password?: string;
  nombre?: string;
  telef?: string;
  ape1?: string;
  ape2?: string;
  dni?: string;
  fechnac?: string | Date;
  direccion?: string;
  localidad?: string;
  codpostal?: string;
  comunidad?: string;
  cif?: string;
  descripcion?: string;
}

export interface AuthUserModel {
  id_usuario: string;
  rol: 'cliente' | 'empresa' | 'administrador';
  estado: boolean;
  email: string;
  nombre?: string;
  telef?: string;
  ape1?: string;
  ape2?: string;
  dni?: string;
  fechnac?: string;
  direccion?: string;
  localidad?: string;
  codpostal?: string;
  comunidad?: string;
  cif?: string;
  descripcion?: string;
}

export interface PreparacionRegistro {
  emailLimpio: string;
  passwordLimpia: string;
  metaData: Record<string, any>;
}
