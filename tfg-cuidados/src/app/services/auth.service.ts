import { Injectable, inject, signal, computed, DestroyRef, Injector } from '@angular/core';
import { from, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { createClient, AuthResponse, UserResponse } from '@supabase/supabase-js';
import { ComunicationService } from './comunication.service';
import { environment } from '../../environments/environment';
import { AuthUserModel, PreparacionRegistro, RegisterPayload } from '../models/Auth-Service';

/**
 * Service for authentication and session management.
 * Manages extended profiles for polymorphic roles (Client, Business, Administrator).
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

  /**
   * Initializes the authentication state on service load.
   */
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

  /**
   * Signs in a user with email and password.
   */
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
   * Recovers a composite profile fetching data from user_public and role-specific tables.
   */
  getProfile(userId: string): Observable<AuthUserModel> {
    return from(this.supabase.from('user_public').select('*').eq('id_user', userId).single()).pipe(
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
   * Signs out the current user.
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
   * Registers a new user and triggers admin notifications.
   */
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
          const rolTexto = isClient ? 'client' : 'business';
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

  /**
   * Registers a new user bypasssing local session persistence (for admin use).
   */
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

  /**
   * Prepares and sanitizes registration data.
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
   * Validates Supabase auth response for common registration errors.
   */
  private registerAnswerValidation(res: AuthResponse): AuthResponse {
    if (res.error) throw res.error;
    if (res.data.user && res.data.user.identities && res.data.user.identities.length === 0) {
      throw new Error('Este correo electrónico ya está registrado.');
    }
    return res;
  }

  /**
   * Manually updates the user signal state.
   */
  updateUserSignal(newUserData: AuthUserModel) {
    this.currentUser.set(newUserData);
  }

  /**
   * Updates auth credentials in Supabase Auth.
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
   * Requests a password recovery email.
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
   * Updates the user's password.
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
   * Resends the verification email.
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
   * Checks if an email exists using a stored procedure.
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
}
