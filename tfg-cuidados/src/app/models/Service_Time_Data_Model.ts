export interface ServiceTimeModalData {
    id_service_time: string;
    id_service: string;
    id_time: string;
    id_business: string;
    price: number | string;
    description: string;
    status?: 'active' | 'inactive';
  }
