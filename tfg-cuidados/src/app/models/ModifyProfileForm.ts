export interface UserProfileModel {
    email?: string;
    telef?: string;
    nombre?: string;
    direccion?: string;
    localidad?: string;
    codpostal?: string;
    comunidad?: string;
    ape1?: string;
    ape2?: string;
    descripcion?: string;
  }
  export interface FormSubmitEvent {
    datos: UserProfileModel;
    rol: string;
  }