import { ComunicationModel } from './ComunicationModel';

export interface MessagesModalData {
  mode: 'writeMessage' | 'readMessage';
  receiverEmail?: string;
  content?: ComunicationModel & {
    Sender?: { email?: string; name?: string };
    Receiver?: { email?: string; name: string };
  };
  direct?: boolean;
}
