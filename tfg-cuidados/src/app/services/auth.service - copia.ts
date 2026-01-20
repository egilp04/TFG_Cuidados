import { Injectable, inject, signal, computed, DestroyRef, Injector } from '@angular/core';
import { from, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment.development';
import { ComunicationService } from './comunication.service';

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
  /**
   * Uso de Angular Signals para un estado de usuario reactivo y eficiente.
   * 'currentUser' permite que toda la aplicación reaccione a cambios en la sesión
   * sin necesidad de suscripciones manuales costosas.
   */
  currentUser = signal<any | null>(null);
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
        switchMap((res) => {
          const user = res.data?.user;
          return user ? this.getProfile(user.id) : of(null);
        }),
        tap((userProfile) => {
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

  signIn(email: string, password: string): Observable<any> {
    return from(this.supabase.auth.signInWithPassword({ email, password })).pipe(
      switchMap((res) => {
        if (res.error) throw res.error;
        return this.getProfile(res.data.user.id);
      }),
      tap((user) => this.currentUser.set(user)),
    );
  }

  /**
   * Recuperación de perfil compuesto.
   * Realiza una agregación de datos consultando en paralelo las tablas de especialización.
   * Garantiza que el objeto de usuario contenga toda la información necesaria
   * según su rol detectado en el login.
   */
  getProfile(userId: string): Observable<any> {
    // 1. Pedimos el usuario base (que ya trae 'rol' y 'estado')
    return from(this.supabase.from('Usuario').select('*').eq('id_usuario', userId).single()).pipe(
      switchMap(async ({ data: user, error: userErr }) => {
        if (userErr) throw userErr;

        // Se usa Promise.all para que sea rápido (en paralelo)
        const [cli, emp, adm] = await Promise.all([
          this.supabase.from('Cliente').select('*').eq('id_cliente', userId).maybeSingle(),
          this.supabase.from('Empresa').select('*').eq('id_empresa', userId).maybeSingle(),
          this.supabase
            .from('Administrador')
            .select('*')
            .eq('id_administrador', userId)
            .maybeSingle(),
        ]);

        let datosExtra = {};
        if (user.rol === 'administrador' && adm.data) {
          datosExtra = adm.data;
        } else if (user.rol === 'empresa' && emp.data) {
          datosExtra = emp.data;
        } else if (user.rol === 'cliente' && cli.data) {
          datosExtra = cli.data;
        }
        return { ...user, ...datosExtra };
      }),
    );
  }

  signOut(): Observable<any> {
    return from(this.supabase.auth.signOut()).pipe(
      tap(() => {
        this.currentUser.set(null);
      }),
    );
  }

  /**
   * Registro con notificación proactiva.
   * Tras un alta exitosa, el sistema invoca al ComunicationService para alertar
   * a los administradores, integrando dos servicios de forma desacoplada.
   */
  register(datos: any, esCliente: boolean): Observable<any> {
    const { emailLimpio, passwordLimpia, metaData } = this.prepararDatosRegistro(datos, esCliente);
    return from(this.supabase.rpc('email_exists', { email_check: emailLimpio })).pipe(
      switchMap(({ data: existe, error }) => {
        if (error) throw new Error('Error técnico al verificar el correo.');
        if (existe) throw new Error('Este correo electrónico ya está registrado.');

        return from(
          this.supabase.auth.signUp({
            email: emailLimpio,
            password: passwordLimpia,
            options: {
              data: metaData,
              emailRedirectTo: 'http://localhost:4200/home',
            },
          }),
        );
      }),
      map((res) => this.validarRespuestaRegistro(res)),
      tap((res) => {
        if (res.data.user) {
          const rolTexto = esCliente ? 'cliente' : 'empresa';
          const comunicationService = this.injector.get(ComunicationService);
          comunicationService
            .notifyAdmins(
              'Nuevo Registro',
              `El usuario ${emailLimpio} se ha registrado como ${rolTexto}.`,
            )
            .subscribe();
        }
      }),
    );
  }
  registerByAdmin(datos: any, esCliente: boolean): Observable<any> {
    const { emailLimpio, passwordLimpia, metaData } = this.prepararDatosRegistro(datos, esCliente);
    const tempSupabase = createClient(environment.supabaseUrl, environment.supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    return from(this.supabase.rpc('email_exists', { email_check: emailLimpio })).pipe(
      switchMap(({ data: existe, error }) => {
        if (error) throw new Error('Error técnico al verificar el correo.');
        if (existe) throw new Error('Este correo electrónico ya está registrado.');

        return from(
          tempSupabase.auth.signUp({
            email: emailLimpio,
            password: passwordLimpia,
            options: {
              data: { ...metaData, created_by_admin: true },
              emailRedirectTo: 'http://localhost:4200/login',
            },
          }),
        );
      }),
      map((res) => this.validarRespuestaRegistro(res)),
    );
  }

  private prepararDatosRegistro(datos: any, esCliente: boolean) {
    const emailLimpio = String(datos.email).trim().toLowerCase().replace(/\s/g, '');
    const passwordLimpia = String(datos.password).trim();
    const rol = esCliente ? 'cliente' : 'empresa';
    const metaData = {
      rol: rol,
      nombre: datos.nombre ? String(datos.nombre).trim() : '',
      telef: datos.telef ? String(datos.telef).trim() : '',
      ape1: datos.ape1 || null,
      ape2: datos.ape2 || null,
      dni: datos.dni ? datos.dni.toUpperCase() : null,
      fechnac: datos.fechnac || null,
      direccion: datos.direccion || '',
      localidad: datos.localidad || '',
      codpostal: datos.codpostal || '',
      comunidad: datos.comunidad || '',
      cif: datos.cif ? datos.cif.toUpperCase() : null,
      descripcion: datos.descripcion,
    };
    return { emailLimpio, passwordLimpia, metaData };
  }
  private validarRespuestaRegistro(res: any) {
    if (res.error) throw res.error;
    if (res.data.user && res.data.user.identities && res.data.user.identities.length === 0) {
      throw new Error('Este correo electrónico ya está registrado.');
    }
    return res;
  }
  updateUserSignal(newUserData: any) {
    this.currentUser.set(newUserData);
  }
  updateAuthCredentiales(nuevoEmail?: string): Observable<any> {
    const updateData: any = {};
    if (nuevoEmail) updateData.email = nuevoEmail;

    return from(this.supabase.auth.updateUser(updateData)).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      }),
      catchError((err) => {
        console.error('Error actualizando credenciales:', err);
        return throwError(() => err);
      }),
    );
  }
  recoverPassword(email: string): Observable<any> {
    return from(
      this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'http://localhost:4200/recover-password',
      }),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      }),
      catchError((err) => throwError(() => err)),
    );
  }
  updatePass(newPassword: string): Observable<any> {
    return from(
      this.supabase.auth.updateUser({
        password: newPassword,
      }),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      }),
      catchError((err) => throwError(() => err)),
    );
  }
}
