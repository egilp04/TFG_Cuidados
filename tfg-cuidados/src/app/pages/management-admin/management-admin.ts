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
  public isUser: boolean = true;
  private responsive = inject(ResponsiveSize);

  ngOnInit(): void {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const tipo = params['tipo'];
      this.chargeData(tipo === 'empresa' ? 'empresa' : 'cliente');
    });
  }

  private chargeData(tipo: 'cliente' | 'empresa'): void {
    this.isUser = tipo === 'cliente';
    this.userService.loadUsers(tipo);
  }

  async toDeleteUser(item: UserModel) {
    const { Cancelmodal } = await import('../../components/cancelmodal/cancelmodal');
    const dialogRef = this.dialog.open(Cancelmodal, {
      width: '100%',
      maxWidth: this.responsive.isMobile() ? '95vw' : '500px',
      maxHeight: '90vh',
      data: { mode: 'eliminar' },
    });
    dialogRef
      .afterClosed()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((result) => result === true),
        switchMap(() =>
          this.userService.deleteUser(item.id_usuario).pipe(
            switchMap(() =>
              this.translate
                .get('MESSAGES.SUCCESS.DELETE_USER')
                .pipe(map((msg) => ({ text: msg, type: 'sucess' as const }))),
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
          if (res.type === 'sucess') {
            this.chargeData(this.isUser ? 'cliente' : 'empresa');
          }
        },
      });
  }

  toEditFunction(item: UserModel) {
    const usuarioConRol = {
      ...item,
      rol: this.isUser ? 'cliente' : 'empresa',
    };
    this.router.navigate(['/modify-profile'], { state: { usuario: usuarioConRol } });
  }

  createNewUser() {
    const tipo = this.isUser ? 'cliente' : 'empresa';
    this.router.navigate(['/register'], { state: { tipo } });
  }
}
