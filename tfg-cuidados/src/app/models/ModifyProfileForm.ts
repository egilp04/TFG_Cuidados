export interface UserProfileModel {
  email?: string;
  phone?: string;
  name?: string;
  address?: string;
  city?: string;
  postcode?: string;
  comunity?: string;
  surname1?: string;
  surname2?: string;
  description?: string;
  avatar_url?: string;
}

export interface FormSubmitEvent {
  data: UserProfileModel;
  rol: string;
  avatarFile?: File | null;
}
