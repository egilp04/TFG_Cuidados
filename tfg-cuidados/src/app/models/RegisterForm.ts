export interface RegisterFormData {
  rol: 'client' | 'business';
  email: string;
  password?: string;
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  postcode?: string;
  comunity?: string;
  surname1?: string;
  surname2?: string;
  dni?: string;
  birthdate?: string;
  cif?: string;
  description?: string;
}

export interface FormSubmittedEvent {
  dts: RegisterFormData;
  isClient: boolean;
}
