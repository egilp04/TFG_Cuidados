import { Injectable, inject, signal, computed, DestroyRef, Injector } from '@angular/core';
import { from, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { createClient, AuthResponse, UserResponse, User } from '@supabase/supabase-js';
import { ComunicationService } from './comunication.service';
import { environment } from '../../environments/environment';
import { AuthUserModel, PreparacionRegistro, RegisterPayload } from '../models/Auth-Service';

/**
 * @description Servicio de autenticación y gestión de sesiones.
 * Implementa el patrón de persistencia de perfiles extendidos para manejar
 * roles polimórficos (Cliente, Empresa, Administrador).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(SupabaseService).getClient();
  private destroyRef = inject(DestroyRef);
  private injector = inject(Injector);

  isLoading = signal<boolean>(true);
  currentUser = signal<AuthUserModel | null>(null);

  isAuthenticated = computed(() => !!this.currentUser());
  userRol = computed(() => this.currentUser()?.rol || null);

  constructor() {
    this.initializeAuth();
  }

  private initializeAuth() {
    this.isLoading.set(true);
    from(this.supabase.auth.getUser())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((res: UserResponse) => {
          const user = res.data?.user;
          return user ? this.getProfile(user.id) : of(null);
        }),
        tap((userProfile: AuthUserModel | null) => {
          this.currentUser.set(userProfile);
          this.isLoading.set(false);
        }),
        catchError(() => {
          this.isLoading.set(false);
          this.currentUser.set(null);
          return of(null);
        }),
      )
      .subscribe();
  }
  signIn(email: string, password: string): Observable<AuthUserModel> {
    return from(this.supabase.auth.signInWithPassword({ email, password })).pipe(
      switchMap((res: AuthResponse) => {
        if (res.error) throw res.error;
        if (!res.data.user) throw new Error('Usuario no encontrado');
        return this.getProfile(res.data.user.id);
      }),
      tap((user: AuthUserModel) => this.currentUser.set(user)),
    );
  }

  /**
   * Recuperación de perfil compuesto.
   */
  getProfile(userId: string): Observable<AuthUserModel> {
    return from(this.supabase.from('Usuario').select('*').eq('id_usuario', userId).single()).pipe(
      switchMap(async ({ data: user, error: userErr }) => {
        if (userErr) throw userErr;

        const [cli, emp, adm] = await Promise.all([
          this.supabase.from('Cliente').select('*').eq('id_cliente', userId).maybeSingle(),
          this.supabase.from('Empresa').select('*').eq('id_empresa', userId).maybeSingle(),
          this.supabase
            .from('Administrador')
            .select('*')
            .eq('id_administrador', userId)
            .maybeSingle(),
        ]);

        let extraData = {};
        if (user.rol === 'administrador' && adm.data) {
          extraData = adm.data;
        } else if (user.rol === 'empresa' && emp.data) {
          extraData = emp.data;
        } else if (user.rol === 'cliente' && cli.data) {
          extraData = cli.data;
        }
        return { ...user, ...extraData } as AuthUserModel;
      }),
    );
  }

  signOut(): Observable<void> {
    return from(this.supabase.auth.signOut()).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      tap(() => {
        this.currentUser.set(null);
      }),
    );
  }

  register(data: RegisterPayload, isClient: boolean): Observable<AuthResponse> {
    const { cleanEmail, cleanEmailPassword, metaData } = this.registerDataPreparation(
      data,
      isClient,
    );

    return from(this.supabase.rpc('email_exists', { email_check: cleanEmail })).pipe(
      switchMap(({ data: existe, error }) => {
        if (error) throw new Error('Error técnico al verificar el correo.');
        if (existe) throw new Error('Este correo electrónico ya está registrado.');

        return from(
          this.supabase.auth.signUp({
            email: cleanEmail,
            password: cleanEmailPassword,
            options: {
              data: metaData,
              emailRedirectTo: `${window.location.origin}/home`,
            },
          }),
        );
      }),
      map((res: AuthResponse) => this.registerAnswerValidation(res)),
      tap((res: AuthResponse) => {
        if (res.data.user) {
          const rolTexto = isClient ? 'cliente' : 'empresa';
          const comunicationService = this.injector.get(ComunicationService);
          comunicationService
            .notifyAdmins(
              'Nuevo Registro',
              `El usuario ${cleanEmail} se ha registrado como ${rolTexto}.`,
            )
            .subscribe();
        }
      }),
    );
  }

  registerByAdmin(dta: RegisterPayload, isClient: boolean): Observable<AuthResponse> {
    const { cleanEmail, cleanEmailPassword, metaData } = this.registerDataPreparation(
      dta,
      isClient,
    );
    const tempSupabase = createClient(environment.supabaseUrl, environment.supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    return from(this.supabase.rpc('email_exists', { email_check: cleanEmail })).pipe(
      switchMap(({ data: existe, error }) => {
        if (error) throw new Error('Error técnico al verificar el correo.');
        if (existe) throw new Error('Este correo electrónico ya está registrado.');
        return from(
          tempSupabase.auth.signUp({
            email: cleanEmail,
            password: cleanEmailPassword,
            options: {
              data: { ...metaData, created_by_admin: true },
              emailRedirectTo: `${window.location.origin}/login`,
            },
          }),
        );
      }),
      map((res: AuthResponse) => this.registerAnswerValidation(res)),
    );
  }

  private registerDataPreparation(data: RegisterPayload, isClient: boolean): PreparacionRegistro {
    const cleanEmail = String(data.email).trim().toLowerCase().replace(/\s/g, '');
    const cleanEmailPassword = String(data.password).trim();
    const rol = isClient ? 'cliente' : 'empresa';

    const metaData = {
      rol: rol,
      nombre: data.nombre ? String(data).trim() : '',
      telef: data.telef ? String(data.telef).trim() : '',
      ape1: data.ape1 || null,
      ape2: data.ape2 || null,
      dni: data.dni ? data.dni.toUpperCase() : null,
      fechnac: data.fechnac || null,
      direccion: data.direccion || '',
      localidad: data.localidad || '',
      codpostal: data.codpostal || '',
      comunidad: data.comunidad || '',
      cif: data.cif ? data.cif.toUpperCase() : null,
      descripcion: data.descripcion || null,
    };

    return { cleanEmail, cleanEmailPassword, metaData };
  }

  private registerAnswerValidation(res: AuthResponse): AuthResponse {
    if (res.error) throw res.error;
    if (res.data.user && res.data.user.identities && res.data.user.identities.length === 0) {
      throw new Error('Este correo electrónico ya está registrado.');
    }
    return res;
  }

  updateUserSignal(newUserData: AuthUserModel) {
    this.currentUser.set(newUserData);
  }

  updateAuthCredentiales(newEmail?: string): Observable<UserResponse> {
    const updateData: { email?: string } = {};
    if (newEmail) updateData.email = newEmail;

    return from(this.supabase.auth.updateUser(updateData)).pipe(
      map((res: UserResponse) => {
        if (res.error) throw res.error;
        return res;
      }),
      catchError((err) => {
        console.error('Error actualizando credenciales:', err);
        return throwError(() => err);
      }),
    );
  }

  recoverPassword(email: string): Observable<void> {
    return from(
      this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/recover-password`,
      }),
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError((err) => throwError(() => err)),
    );
  }

  updatePass(newPassword: string): Observable<UserResponse> {
    return from(
      this.supabase.auth.updateUser({
        password: newPassword,
      }),
    ).pipe(
      map((res: UserResponse) => {
        if (res.error) throw res.error;
        return res;
      }),
      catchError((err) => throwError(() => err)),
    );
  }

  resendVerificationEmail(email: string): Observable<void> {
    return from(
      this.supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      }),
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  checkEmailExists(email: string): Observable<boolean> {
    const promise = this.supabase.rpc('check_user_exists', { email_busqueda: email });
    return from(promise).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error verificando email:', error);
          return false;
        }
        return data as boolean;
      }),
      catchError(() => of(false)),
    );
  }
}
