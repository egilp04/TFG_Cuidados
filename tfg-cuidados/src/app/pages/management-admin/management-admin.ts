import { Component, inject, OnInit, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { switchMap, map, catchError } from 'rxjs/operators';
import { UserService } from '../../services/user.service';
import { MessageService } from '../../services/message-service';
import { Cancelmodal } from '../../components/cancelmodal/cancelmodal';
import { TableCrudAdmin } from '../../components/table-crud-admin/table-crud-admin';
import { Buttonback } from '../../components/buttonback/buttonback';
import { ButtonComponent } from '../../components/button/button';

@Component({
  selector: 'app-management-admin',
  standalone: true,
  imports: [CommonModule, TableCrudAdmin, Buttonback, ButtonComponent, TranslateModule],
  templateUrl: './management-admin.html',
})
export class ManagementAdmin implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);
  public messageService = inject(MessageService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  private cd = inject(ChangeDetectorRef);
  private translate = inject(TranslateService);
  public isUser: boolean = true;
  public usuarios$!: Observable<any[]>;

  ngOnInit(): void {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const tipo = params['tipo'];
      this.cargarDatos(tipo === 'empresa' ? 'empresa' : 'cliente');
    });
  }
  private cargarDatos(tipo: 'cliente' | 'empresa'): void {
    this.isUser = tipo === 'cliente';
    this.usuarios$ = this.userService.getUsersObservable(tipo);
    this.cd.detectChanges();
  }

  cambiarVista(tipo: 'cliente' | 'empresa') {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tipo: tipo },
      queryParamsHandling: 'merge',
    });
  }

  onEliminarUsuario(item: any) {
    const dialogRef = this.dialog.open(Cancelmodal, {
      width: '500px',
      data: { modo: 'eliminar' },
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
                .pipe(map((msg) => ({ text: msg, type: 'exito' as const })))
            ),
            catchError(() =>
              this.translate
                .get('MESSAGES.ERROR.DELETE_USER')
                .pipe(map((msg) => ({ text: msg, type: 'error' as const })))
            )
          )
        )
      )
      .subscribe({
        next: (res) => {
          this.messageService.showMessage(res.text, res.type);
          this.cargarDatos(this.isUser ? 'cliente' : 'empresa');
        },
      });
  }

  onEditar(item: any) {
    const usuarioConRol = {
      ...item,
      rol: this.isUser ? 'cliente' : 'empresa',
    };
    this.router.navigate(['/modify-profile'], { state: { usuario: usuarioConRol } });
  }

  onNuevoUsuario() {
    const tipo = this.isUser ? 'cliente' : 'empresa';
    this.router.navigate(['/register'], { state: { tipo } });
  }
}
