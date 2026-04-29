export interface RegisterPayload {
  email: string;
  password?: string;
  name?: string;
  phone?: string;
  surname1?: string;
  surname2?: string;
  dni?: string;
  birthdate?: string | Date;
  address?: string;
  city?: string;
  postcode?: string;
  comunity?: string;
  cif?: string;
  description?: string;
}

export interface AuthUserModel {
  id_user: string;
  rol: 'client' | 'business' | 'administrator';
  state: boolean;
  email: string;
  name?: string;
  phone?: string;
  surname1?: string;
  surname2?: string;
  dni?: string;
  birthdate?: string;
  address?: string;
  city?: string;
  portcode?: string;
  comunity?: string;
  cif?: string;
  description?: string;
  avatar_url?:string;
}

export interface PreparacionRegistro {
  cleanEmail: string;
  cleanEmailPassword: string;
  metaData: Record<string, any>;
}
