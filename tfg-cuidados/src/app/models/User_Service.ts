export interface UpdateProfilePayload {
  name: string;
  email: string;
  phone: string;
  surname1?: string;
  surname2?: string;
  address?: string;
  city?: string;
  postcode?: string;
  comunity?: string;
  description?: string;
  avatar_url?: string;
}

export interface UserModel extends UpdateProfilePayload {
  id_user: string;
  rol: string;
  state: boolean;
}

export interface UserEmailResponse {
  id_user: string;
  name: string;
  email: string;
}

export interface UserNameResponse {
  name: string;
}

export interface RpcSuccessResponse {
  success: boolean;
}
