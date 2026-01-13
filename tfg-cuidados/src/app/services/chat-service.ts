import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { from, map, Observable, Subject } from 'rxjs';
import { AuthService } from './auth.service';
import { RealtimeChannel } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private supabase = inject(SupabaseService).getClient();
  private authService = inject(AuthService);

  public nuevosMensajes$ = new Subject<any>();
  private canalActual: RealtimeChannel | null = null;

  async inicializarChatUsuario() {
    const user = this.authService.currentUser();
    if (!user) throw new Error('Usuario no logueado');

    const { data: chatExistente } = await this.supabase
      .from('chats')
      .select('*')
      .eq('usuario_id', user.id_usuario)
      .single();

    if (chatExistente) return chatExistente;

    const { data: nuevoChat, error } = await this.supabase
      .from('chats')
      .insert({ usuario_id: user.id_usuario })
      .select()
      .single();

    if (error) throw error;
    return nuevoChat;
  }

  obtenerMensajes(chatId: string): Observable<any[]> {
    return from(
      this.supabase
        .from('mensajes')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })
    ).pipe(map((res) => res.data || []));
  }

  async enviarMensaje(chatId: string, texto: string) {
    const user = this.authService.currentUser();
    const { error } = await this.supabase.from('mensajes').insert({
      chat_id: chatId,
      emisor_id: user?.id_usuario,
      texto: texto,
    });

    if (!error) {
      await this.supabase.from('chats').update({ updated_at: new Date() }).eq('id', chatId);
    }
  }

  subscribeToChat(chatId: string) {
    if (this.canalActual) {
      this.supabase.removeChannel(this.canalActual);
      this.canalActual = null;
    }
    this.canalActual = this.supabase
      .channel(`sala_chat:${chatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mensajes', filter: `chat_id=eq.${chatId}` },
        (payload) => {
          this.nuevosMensajes$.next(payload.new);
        }
      );
    this.canalActual.subscribe();
  }

  desconectar() {
    if (this.canalActual) {
      this.supabase.removeChannel(this.canalActual);
      this.canalActual = null;
    }
  }

  obtenerTodosLosChats() {
    return from(
      this.supabase
        .from('chats')
        .select('*, Usuario!chats_usuario_id_fkey ( nombre, email, id )')
        .order('updated_at', { ascending: false })
    ).pipe(map((res) => res.data || []));
  }
}
