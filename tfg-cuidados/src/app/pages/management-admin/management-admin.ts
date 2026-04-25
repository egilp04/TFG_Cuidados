import { Component, inject, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { switchMap, map, catchError } from 'rxjs/operators';
import { MessageService } from '../../services/message-service';
import { TableCrudAdmin } from '../../components/table-crud-admin/table-crud-admin';
import { Buttonback } from '../../components/buttonback/buttonback';
import { ButtonComponent } from '../../components/button/button';
import { UserService } from '../../services/user.service';
import { UserModel } from '../../models/User_Service';
import { ResponsiveSize } from '../../services/responsive-size';

/**
 * Página de gestión de administrador para listar, editar y eliminar usuarios (clientes o negocios).
 */
@Component({
  selector: 'app-management-admin',
  standalone: true,
  imports: [CommonModule, TableCrudAdmin, Buttonback, ButtonComponent, TranslateModule],
  templateUrl: './management-admin.html',
})
export default class ManagementAdmin implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  public userService = inject(UserService);
  public messageService = inject(MessageService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  private translate = inject(TranslateService);
  private responsive = inject(ResponsiveSize);

  public isClient: boolean = true;

  ngOnInit(): void {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const type = params['type'];
      this.loadData(type === 'business' ? 'business' : 'client');
    });
  }

  /**
   * Actualiza el estado de la vista e inicia la carga de la lista de usuarios desde el servicio.
   * @param type El tipo de usuario a gestionar: 'client' o 'business'.
   */
  private loadData(type: 'client' | 'business'): void {
    this.isClient = type === 'client';
    this.userService.loadUsers(type);
  }

  /**
   * Abre una modal de confirmación y elimina el usuario seleccionado.
   * @param user El registro de usuario a eliminar.
   */
  async deleteUser(user: UserModel): Promise<void> {
    const { Cancelmodal } = await import('../../components/cancelmodal/cancelmodal');

    const dialogRef = this.dialog.open(Cancelmodal, {
      width: '100%',
      maxWidth: this.responsive.isMobile() ? '95vw' : '600px',
      maxHeight: '90vh',
      data: { mode: 'delete' },
    });

    dialogRef
      .afterClosed()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((result) => result === true),
        switchMap(() =>
          this.userService.deleteUser(user.id_user!).pipe(
            switchMap(() =>
              this.translate
                .get('MESSAGES.SUCCESS.DELETE_USER')
                .pipe(map((msg) => ({ text: msg, type: 'success' as const }))),
            ),
            catchError(() =>
              this.translate
                .get('MESSAGES.ERROR.DELETE_USER')
                .pipe(map((msg) => ({ text: msg, type: 'error' as const }))),
            ),
          ),
        ),
      )
      .subscribe({
        next: (res) => {
          this.messageService.showMessage(res.text, res.type);
          if (res.type === 'success') {
            this.loadData(this.isClient ? 'client' : 'business');
          }
        },
      });
  }

  /**
   * Navega a la página de modificación de perfil con los datos del usuario seleccionado.
   * @param user El registro de usuario a editar.
   */
  editUser(user: UserModel): void {
    const userWithRole = {
      ...user,
      rol: this.isClient ? 'client' : 'business',
    };
    this.router.navigate(['/modify-profile'], {
      state: { user: userWithRole },
    });
  }

  /**
   * Redirige a la página de registro para crear un nuevo usuario del tipo actual.
   */
  createUser(): void {
    const type = this.isClient ? 'client' : 'business';
    this.router.navigate(['/register'], {
      state: { type },
    });
  }
}
