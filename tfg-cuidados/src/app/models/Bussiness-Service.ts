export interface ServiceDetail {
  name: string;
  type_service: string;
  id_service: string;
}

export interface TimeDetail {
  week_day: string;
  time: string;
}

export interface ServiceTimeResponse {
  id_service_time: string;
  price: number;
  description?: string;
  Service?: ServiceDetail;
  Time?: TimeDetail;
}

export interface BusinessSupabaseJoinModel {
  id_business: string;
  cif?: string;
  address?: string;
  city?: string;
  postcode?: string;
  comunity?: string;
  phone?: string;
  description?: string;
  User_public?: {
    name: string;
    email: string;
    state: boolean;
  };
  Service_Time?: ServiceTimeResponse[];
  [key: string]: unknown;
}

export interface BusinessModel {
  id_business: string;
  name: string;
  email: string;
  cif?: string;
  address?: string;
  city?: string;
  postcode?: string;
  comunity?: string;
  phone?: string;
  description?: string;
  Service_Time: ServiceTimeResponse[];
}
