import { ComunicacionModel } from "./Comunicacion";

export interface MessagesModalData {
  modo: 'escribir' | 'showMessage';
  receptorEmail?: string;
  contenido?: ComunicacionModel & {
    Emisor?: { email: string };
    Receptor?: { nombre: string };
  };
}
