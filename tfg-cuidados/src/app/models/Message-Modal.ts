import { ComunicationModel } from './Comunicacion';

export interface MessagesModalData {
  mode: 'escribir' | 'showMessage';
  receiverEmail?: string;
  content?: ComunicationModel & {
    Sender?: { email?: string; name?: string };
    Receiver?: { name: string };
  };
}
