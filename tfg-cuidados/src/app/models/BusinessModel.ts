import { ServiceTimeResponse } from './Business-Service';

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