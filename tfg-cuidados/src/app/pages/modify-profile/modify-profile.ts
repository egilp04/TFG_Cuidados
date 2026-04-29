import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule, Location } from '@angular/common';
import { of, switchMap, filter, tap, timer, catchError, map, EMPTY } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService } from '../../services/message-service';
import { Buttonback } from '../../components/buttonback/buttonback';
import { Modifyprofileform } from '../../components/modifyprofileform/modifyprofileform';
import { AuthUserModel } from '../../models/Auth-Service';
import { FormSubmitEvent } from '../../models/ModifyProfileForm';
import { UpdateProfilePayload } from '../../models/User_Service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

/**
 * Componente para manejar las modificaciones del perfil de usuario.
 * Soporta actualizar datos de perfil y eliminar/desuscribir cuentas.
 */
@Component({
  selector: 'app-modify-profile',
  standalone: true,
  imports: [Modifyprofileform, CommonModule, Buttonback, TranslateModule],
  templateUrl: './modify-profile.html',
  styleUrl: './modify-profile.css',
})
export default class ModifyProfilePage implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private cd = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  public messageService = inject(MessageService);
  private translate = inject(TranslateService);
  private location = inject(Location);

  public userRole = signal<'client' | 'business' | 'administrator'>('client');
  public userToEdit = signal<AuthUserModel | null>(null);

  ngOnInit(): void {
    const state = history.state as { user?: AuthUserModel; usuario?: AuthUserModel };
    const targetUser = state.user || state.usuario;

    if (targetUser) {
      this.userToEdit.set(targetUser);
      this.userRole.set(this.normalizeRole(targetUser.rol));
    } else {
      const currentUser = this.authService.currentUser();
      if (currentUser) {
        this.userToEdit.set(currentUser);
        this.userRole.set(this.normalizeRole(currentUser.rol));
      }
    }
    setTimeout(() => this.cd.detectChanges(), 0);
  }

  /**
   * Normaliza la cadena de rol de usuario para que coincida con el esquema de aplicación en inglés.
   */
  private normalizeRole(role: string | undefined): 'client' | 'business' | 'administrator' {
    if (role === 'business') return 'business';
    if (role === 'administrator') return 'administrator';
    return 'client';
  }

  /**
   * Envía los datos de perfil actualizados al servidor.
   * Actualiza las credenciales de autenticación si el correo fue cambiado por el usuario actualmente activo.
   * @param event El evento de envío del formulario que contiene los nuevos datos de perfil.
   */
doUpdateProfile(event: FormSubmitEvent): void {
  const user = this.userToEdit();
  const loggedUser = this.authService.currentUser();

  if (!user) return;

  const newData = event.data as UpdateProfilePayload;
  const role = event.rol;
  const file = event.avatarFile;

  const uploadImage$ = file 
    ? this.userService.uploadAvatar(user.id_user, file) 
    : of(user.avatar_url || null);

  uploadImage$.pipe(
    takeUntilDestroyed(this.destroyRef),
    switchMap((newAvatarUrl) => {
      newData.avatar_url = newAvatarUrl ?? undefined;
            return this.userService.updateProfileDirect(user.id_user, newData, role);
    }),
    switchMap(() => {
      const isSelfUpdate = user.id_user === loggedUser?.id_user;
      const emailChanged = newData.email !== user.email;
      if (isSelfUpdate && emailChanged) {
        return this.authService.updateAuthCredentiales(newData.email);
      }
      return of(null);
    }),
    switchMap(() => this.translate.get('MODIFY_PROFILE.MESSAGES.UPDATE_SUCCESS')),
    tap((msg: string) => {
      this.messageService.showMessage(msg, 'success');
      const isSelfUpdate = user.id_user === loggedUser?.id_user;

      if (isSelfUpdate) {
        const updatedUser = { ...loggedUser, ...newData } as AuthUserModel;
        this.authService.updateUserSignal(updatedUser);
      }
      this.cd.detectChanges();
    }),
    switchMap(() => timer(1500)),
    tap(() => {
      this.location.back();
    }),

    catchError((err: Error) => {
      console.error('Error en el proceso de actualización:', err);
      return this.translate.get('MODIFY_PROFILE.MESSAGES.UPDATE_ERROR').pipe(
        tap((msg: string) => this.messageService.showMessage(msg, 'error')),
        switchMap(() => EMPTY),
      );
    }),
  )
  .subscribe();
}

  /**
   * Solicita confirmación del usuario y elimina la cuenta.
   * Cierra la sesión del usuario si está eliminando su propia cuenta.
   */
  async unsubscribeUser(): Promise<void> {
    const user = this.userToEdit();
    const currentUser = this.authService.currentUser();

    if (!user) return;

    const { Cancelmodal } = await import('../../components/cancelmodal/cancelmodal');

    this.dialog
      .open(Cancelmodal, {
        width: '600px',
        data: { mode: 'unsubscribe' },
        autoFocus: false,
      })
      .afterClosed()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((result) => result === true),
        switchMap(() => this.userService.deleteUser(user.id_user)),
        switchMap(() => {
          const isSelfUpdate = user.id_user === currentUser?.id_user;
          if (isSelfUpdate) {
            return this.authService.signOut().pipe(
              tap(() => this.router.navigate(['/'])),
              map(() => true),
            );
          } else {
            this.location.back();
            return of(true);
          }
        }),
        switchMap((success) =>
          success
            ? this.translate
                .get('MODIFY_PROFILE.MESSAGES.DELETE_SUCCESS')
                .pipe(map((msg) => ({ msg, type: 'success' as const })))
            : EMPTY,
        ),
        catchError((err: Error) => {
          console.error('Error desuscribiendo usuario:', err);
          return this.translate
            .get('MODIFY_PROFILE.MESSAGES.DELETE_ERROR')
            .pipe(map((msg) => ({ msg, type: 'error' as const })));
        }),
      )
      .subscribe((result) => {
        if (result && result.msg) {
          this.messageService.showMessage(result.msg, result.type);
        }
      });
  }

  /**
   * Navega hacia atrás en el historial de navegación.
   */
  navigateBack(): void {
    this.location.back();
  }
}
