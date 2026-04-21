export interface ContractModel {
  id_contract?: string;
  state: 'activo' | 'no activo';
  start_date: string;
  end_date: string | null;
  week_day_hired: string;
  time_hired: string;
  id_service_time: string;
  creation_date: string;
  id_client: string;
  id_business: string;
}

export interface ContractSupabaseJoined {
  id_contract: string;
  state: string;
  id_client: string;
  id_business: string;
  creation_date?: string;
  end_date?: string;
  Service_Time?: {
    id_service_time?: string;
    Service?: { name?: string };
  };
  Client?: {
    name?: string;
    address?: string;
    city?: string;
    postcode?: string;
    User_public?: { name?: string; email?: string };
  };
  Business?: {
    name?: string;
    User_public?: { name?: string; email?: string };
  };
  [key: string]: unknown;
}

export interface ContractDetail extends ContractModel {
  id_contract: string;
  id_st_flat?: string;
  serviceName?: string;
  Client?: {
    address?: string;
    city?: string;
    postcode?: string;
    clientName: string;
  };
  Business?: {
    businessName: string;
  };
}
