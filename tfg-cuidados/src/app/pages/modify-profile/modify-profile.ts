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

  userRole = signal<'cliente' | 'empresa' | 'administrador'>('cliente');
  userToEdit = signal<AuthUserModel | null>(null);

  ngOnInit() {
    const state = history.state as { usuario?: AuthUserModel };
    if (state && state.usuario) {
      this.userToEdit.set(state.usuario);
      this.userRole.set(state.usuario.rol);
    } else {
      const user = this.authService.currentUser();
      if (user) {
        this.userToEdit.set(user);
        this.userRole.set(user.rol);
      }
    }
    setTimeout(() => this.cd.detectChanges(), 0);
  }

  doUpdateProfile(event: FormSubmitEvent) {
    const user = this.userToEdit();
    const loggueUser = this.authService.currentUser();
    if (!user) return;
    const newData = event.datos as UpdateProfilePayload;
    const rol = event.rol;

    this.userService
      .updateProfileDirect(user.id_usuario, newData, rol)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => {
          const itsMyself = user.id_usuario === loggueUser?.id_usuario;
          const emailCambio = newData.email !== user.email;
          if (itsMyself && emailCambio) {
            return this.authService.updateAuthCredentiales(newData.email);
          }
          return of(null);
        }),
        switchMap(() => this.translate.get('MODIFY_PROFILE.MESSAGES.UPDATE_SUCCESS')),
        tap((msg) => {
          this.messageService.showMessage(msg, 'success');
          const itsMyself = user.id_usuario === loggueUser?.id_usuario;
          if (itsMyself) {
            const updatedUser = { ...loggueUser, ...newData } as AuthUserModel;
            this.authService.updateUserSignal(updatedUser);
          }
          this.cd.detectChanges();
        }),
        switchMap(() => timer(1500)),
        tap(() => {
          this.location.back();
        }),
        catchError((err) => {
          console.error('Error actualizando perfil:', err);
          this.messageService.showMessage('Error al guardar los cambios', 'error');
          return of(null);
        }),
      )
      .subscribe();
  }
  async doUserLow() {
    const user = this.userToEdit();
    const currentUser = this.authService.currentUser();
    if (!user) return;
    const { Cancelmodal } = await import('../../components/cancelmodal/cancelmodal');
    this.dialog
      .open(Cancelmodal, {
        width: '500px',
        data: { mode: 'baja' },
        autoFocus: false,
      })
      .afterClosed()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((result) => result === true),
        switchMap(() => this.userService.deleteUser(user.id_usuario)),
        switchMap(() => {
          const itsMyself = user.id_usuario === currentUser?.id_usuario;
          if (itsMyself) {
            return this.authService.signOut().pipe(tap(() => this.router.navigate(['/'])));
          } else {
            this.location.back();
            return of(true);
          }
        }),
        catchError((err) => {
          console.error('Error al dar de baja:', err);
          this.messageService.showMessage('Hubo un error al eliminar el usuario', 'error');
          return of(false);
        }),
      )
      .subscribe((success) => {
        if (success) {
          this.messageService.showMessage('Usuario eliminado correctamente', 'success');
        }
      });
  }

  backHome() {
    this.location.back();
  }
}
