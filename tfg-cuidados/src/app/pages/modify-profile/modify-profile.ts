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
import { UpdateProfilePayload } from '../../models/User-Service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-modify-profile',
  standalone: true,
  imports: [Modifyprofileform, CommonModule, Buttonback, TranslateModule],
  templateUrl: './modify-profile.html',
  styleUrl: './modify-profile.css',
})
export class ModifyProfilePage implements OnInit {
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
  usuarioAEditar = signal<AuthUserModel | null>(null);

  ngOnInit() {
    const state = history.state as { usuario?: AuthUserModel };
    if (state && state.usuario) {
      this.usuarioAEditar.set(state.usuario);
      this.userRole.set(state.usuario.rol);
    } else {
      const user = this.authService.currentUser();
      if (user) {
        this.usuarioAEditar.set(user);
        this.userRole.set(user.rol);
      }
    }
    setTimeout(() => this.cd.detectChanges(), 0);
  }
  
  ejecutarActualizacion(event: FormSubmitEvent) {
    const user = this.usuarioAEditar();
    const userLogueado = this.authService.currentUser();
    if (!user) return;
    const nuevosDatos = event.datos as UpdateProfilePayload;
    const rol = event.rol;

    this.userService
      .updateProfileDirect(user.id_usuario, nuevosDatos, rol)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => {
          const soyYo = user.id_usuario === userLogueado?.id_usuario;
          const emailCambio = nuevosDatos.email !== user.email;
          if (soyYo && emailCambio) {
            return this.authService.updateAuthCredentiales(nuevosDatos.email);
          }
          return of(null);
        }),
        switchMap(() => this.translate.get('MODIFY_PROFILE.MESSAGES.UPDATE_SUCCESS')),
        tap((msg) => {
          this.messageService.showMessage(msg, 'exito');
          const soyYo = user.id_usuario === userLogueado?.id_usuario;
          if (soyYo) {
            const usuarioActualizado = { ...userLogueado, ...nuevosDatos } as AuthUserModel;
            this.authService.updateUserSignal(usuarioActualizado);
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
  async ejecutarBaja() {
    const user = this.usuarioAEditar();
    const currentUser = this.authService.currentUser();
    if (!user) return;
    const { Cancelmodal } = await import('../../components/cancelmodal/cancelmodal');
    this.dialog
      .open(Cancelmodal, {
        width: '500px',
        data: { modo: 'baja' },
        autoFocus: false,
      })
      .afterClosed()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((result) => result === true),
        switchMap(() => this.userService.deleteUser(user.id_usuario)),
        switchMap(() => {
          const soyYo = user.id_usuario === currentUser?.id_usuario;
          if (soyYo) {
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
        })
      )
      .subscribe((exito) => {
        if (exito) {
          this.messageService.showMessage('Usuario eliminado correctamente', 'exito');
        }
      });
  }

  backHome() {
    this.location.back();
  }
}
