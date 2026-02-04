export interface ComunicacionModel {
  id_comunicacion?: string;
  tipo_comunicacion: 'mensaje' | 'notificacion';
  contenido: string;
  fecha_envio: Date;
  leido: boolean;
  id_receptor?: string;
  id_emisor?: string | null;
  asunto: string;
  eliminado_por_emisor?: boolean;
  eliminado_por_receptor?: boolean;
}
