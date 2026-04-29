export interface Contractmodel {
  id_contract: string;
  start_date: string | Date;
  end_date?: string | Date | null;
  week_day_hired?: string;
  time_hired?: string;
  serviceName?: string;
  Business?: {
    businessName?: string;
  };
  Client?: {
    clientName?: string;
    address?: string;
    city?: string;
    postcode?: string;
  };
}

export interface ContractRowDataTable extends Contractmodel {
  nameToShow: string;
  place: string;
  avatar_url?: string;
}
