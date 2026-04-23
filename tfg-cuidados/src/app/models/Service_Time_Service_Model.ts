import { Service_Time_Model } from './Service_Time_Model';

export interface ServiceNested {
  name: string;
  type_service: string;
}

export interface TimeNested {
  time: string;
  week_day: string;
}

export interface ServiceTimeJoined extends Service_Time_Model {
  Service?: ServiceNested;
  Time?: TimeNested;
}
