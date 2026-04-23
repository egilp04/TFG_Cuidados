import { Injectable, inject, signal, computed, DestroyRef, Injector } from '@angular/core';
import { from, Observable, of, throwError, timer, zip } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { createClient, AuthResponse, UserResponse } from '@supabase/supabase-js';
import { ComunicationService } from './comunication.service';
import { environment } from '../../environments/environment';
import { AuthUserModel, PreparacionRegistro, RegisterPayload } from '../models/Auth-Service';
import { TranslateService } from '@ngx-translate/core';

/**
 * Servicio de autenticación y gestión de sesiones.
 * Gestiona perfiles extendidos para roles polimórficos (Cliente, Negocio, Administrador).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(SupabaseService).getClient();
  private destroyRef = inject(DestroyRef);
  private injector = inject(Injector);
  private translate = inject(TranslateService);

  isLoading = signal<boolean>(true);
  currentUser = signal<AuthUserModel | null>(null);

  isAuthenticated = computed(() => !!this.currentUser());
  userRol = computed(() => this.currentUser()?.rol || null);

  constructor() {
    this.initializeAuth();
  }

  /**
   * Inicializa el estado de autenticación al cargar el servicio.
   */
  private initializeAuth() {
    this.isLoading.set(true);
      const minWaitTime$ = timer(1500);
      const authRequest$ = from(this.supabase.auth.getUser()).pipe(
      switchMap((res: UserResponse) => {
        const user = res.data?.user;
        return user ? this.getProfile(user.id) : of(null);
      })
    );
    zip(authRequest$, minWaitTime$)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(([userProfile, _]) => {
          this.currentUser.set(userProfile);
          this.isLoading.set(false);
        }),
        catchError(() => {
          this.isLoading.set(false);
          this.currentUser.set(null);
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Inicia sesión en un usuario con correo electrónico y contraseña.
   */
  signIn(email: string, password: string): Observable<AuthUserModel> {
    return from(this.supabase.auth.signInWithPassword({ email, password })).pipe(
      switchMap((res: AuthResponse) => {
        if (res.error) {
          const errorKey = res.error.message.toUpperCase().replace(/\s+/g, '_');
          throw new Error(this.translate.instant(`ERRORS.AUTH.ERRORS.${errorKey}`));
        }

        if (!res.data.user) {
          throw new Error(this.translate.instant('ERRORS.AUTH.ERRORS.USER_NOT_FOUND'));
        }
        return this.getProfile(res.data.user.id);
      }),
      tap((user: AuthUserModel) => this.currentUser.set(user)),
    );
  }

  /**
   * Recupera un perfil compuesto obteniendo datos de User_public y tablas específicas del rol.
   */
  getProfile(userId: string): Observable<AuthUserModel> {
    return from(this.supabase.from('User_public').select('*').eq('id_user', userId).single()).pipe(
      switchMap(async ({ data: user, error: userErr }) => {
        if (userErr) throw userErr;

        const [cli, bus, adm] = await Promise.all([
          this.supabase.from('Client').select('*').eq('id_client', userId).maybeSingle(),
          this.supabase.from('Business').select('*').eq('id_business', userId).maybeSingle(),
          this.supabase
            .from('Administrator')
            .select('*')
            .eq('id_administrator', userId)
            .maybeSingle(),
        ]);

        let extraData = {};
        if (user.rol === 'administrator' && adm.data) {
          extraData = adm.data;
        } else if (user.rol === 'business' && bus.data) {
          extraData = bus.data;
        } else if (user.rol === 'client' && cli.data) {
          extraData = cli.data;
        }
        return { ...user, ...extraData } as AuthUserModel;
      }),
    );
  }

  /**
   * Cierra la sesión del usuario actual.
   */
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

  /**
   * Registra un nuevo usuario y desencadena notificaciones de administrador.
   */
  register(data: RegisterPayload, isClient: boolean): Observable<AuthResponse> {
    const { cleanEmail, cleanEmailPassword, metaData } = this.registerDataPreparation(
      data,
      isClient,
    );

    return from(this.supabase.rpc('email_exists', { email_check: cleanEmail })).pipe(
      switchMap(({ data: existe, error }) => {
        if (error) throw new Error(this.translate.instant('ERRORS.AUTH.ERRORS.TECHNICAL_ERROR'));
        if (existe)
          throw new Error(this.translate.instant('ERRORS.AUTH.ERRORS.EMAIL_ALREADY_REGISTERED'));
        return from(
          this.supabase.auth.signUp({
            email: cleanEmail,
            password: cleanEmailPassword,
            options: {
              data: metaData,
              emailRedirectTo: `${window.location.origin}/`,
            },
          }),
        );
      }),
      map((res: AuthResponse) => this.registerAnswerValidation(res)),
      tap((res: AuthResponse) => {
        if (res.data.user) {
          const rolKey = isClient ? 'ERRORS.ROLES.CLIENT' : 'ERRORS.ROLES.BUSINESS';
          const rolTexto = this.translate.instant(rolKey);
          const topic = this.translate.instant('ERRORS.NOTIFICATIONS.ADMIN.NEW_REGISTER_TITLE');
          const message = this.translate.instant('ERRORS.NOTIFICATIONS.ADMIN.NEW_REGISTER_BODY', {
            email: cleanEmail,
            rol: rolTexto,
          });

          const comunicationService = this.injector.get(ComunicationService);
          comunicationService.notifyAdmins(topic, message).subscribe();
        }
      }),
    );
  }

  /**
   * Registra un nuevo usuario omitiendo la persistencia de sesión local (para uso administrativo).
   */

  registerByAdmin(data: RegisterPayload, isClient: boolean): Observable<AuthResponse> {
    const { cleanEmail, cleanEmailPassword, metaData } = this.registerDataPreparation(
      data,
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
        if (error) {
          throw new Error(this.translate.instant('AUTH.ERROR.TECHNICAL_ERROR'));
        }
        if (existe) {
          throw new Error(this.translate.instant('AUTH.ERROR.EMAIL_ALREADY_REGISTERED'));
        }
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

  /**
   * Prepara y desinfecta los datos de registro.
   */
  private registerDataPreparation(data: RegisterPayload, isClient: boolean): PreparacionRegistro {
    const cleanEmail = String(data.email).trim().toLowerCase().replace(/\s/g, '');
    const cleanEmailPassword = String(data.password).trim();
    const rol = isClient ? 'client' : 'business';

    const metaData = {
      rol: rol,
      name: data.name ? String(data.name).trim() : '',
      phone: data.phone ? String(data.phone).trim() : '',
      surname1: data.surname1 || null,
      surname2: data.surname2 || null,
      dni: data.dni ? data.dni.toUpperCase() : null,
      birthdate: data.birthdate || null,
      address: data.address || '',
      city: data.city || '',
      postcode: data.postcode || '',
      comunity: data.comunity || '',
      cif: data.cif ? data.cif.toUpperCase() : null,
      description: data.description || null,
    };

    return { cleanEmail, cleanEmailPassword, metaData };
  }

  /**
   * Valida la respuesta de autenticación de Supabase para errores de registro comunes.
   */
  private registerAnswerValidation(res: AuthResponse): AuthResponse {
    if (res.error) throw res.error;
    if (res.data.user && res.data.user.identities && res.data.user.identities.length === 0) {
      throw new Error(this.translate.instant('ERRORS.AUTH.ERRORS.EMAIL_ALREADY_REGISTERED'));
    }
    return res;
  }

  /**
   * Actualiza manualmente el estado de la señal del usuario.
   */
  updateUserSignal(newUserData: AuthUserModel) {
    this.currentUser.set(newUserData);
  }

  /**
   * Actualiza credenciales de autenticación en Supabase Auth.
   */
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

  /**
   * Solicita un correo de recuperación de contraseña.
   */
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

  /**
   * Actualiza la contraseña del usuario.
   */
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

  /**
   * Reenvía el correo de verificación.
   */
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

  /**
   * Verifica si un correo existe usando un procedimiento almacenado.
   */
  checkEmailExists(email: string): Observable<boolean> {
    const promise = this.supabase.rpc('check_user_exists', { email_search: email });
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


 /**
   * Verifica si un correo existe y el usuario esta activo (state=true) usando un procedimiento almacenado.
   */
  check_user_email_active(email: string): Observable<boolean> {
    const promise = this.supabase.rpc('check_user_email_active', { email_search: email });
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
