export interface RegisterFormData {
    rol: 'cliente' | 'empresa';
    email: string;
    password?: string;
    nombre?: string;
    telef?: string;
    direccion?: string;
    localidad?: string;
    codpostal?: string;
    comunidad?: string;
    ape1?: string;
    ape2?: string;
    dni?: string;
    fechnac?: string;
    cif?: string;
    descripcion?: string;
  }
  
  export interface FormSubmittedEvent {
    datos: RegisterFormData;
    esCliente: boolean;
  }