export interface ComunicationModel {
  id_comunication?: string;
  type_comunication: 'mensaje' | 'notificacion';
  content: string;
  read: boolean;
  send_date: Date;
  id_receiver?: string;
  id_sender?: string | null;
  topic: string;
  deleted_by_sender?: boolean;
  deleted_by_receiver?: boolean;
}
