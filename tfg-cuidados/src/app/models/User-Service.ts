export interface UpdateProfilePayload {
    nombre: string;
    email: string;
    telef: string;
    ape1?: string;
    ape2?: string;
    direccion?: string;
    localidad?: string;
    codpostal?: string;
    comunidad?: string;
    descripcion?: string;
  }
  export interface UserModel extends UpdateProfilePayload {
    id_usuario: string;
    rol: string;
    estado: boolean;
  }
  export interface UserEmailResponse {
    id_usuario: string;
    nombre: string;
    email: string;
  }
  
  export interface UserNameResponse {
    nombre: string;
  }
  
  export interface RpcSuccessResponse {
    success: boolean;
  }
  