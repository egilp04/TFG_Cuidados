import { Component, OnInit, inject, DestroyRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { filter, switchMap, map, catchError, tap, finalize } from 'rxjs/operators';
import { from } from 'rxjs';
import { UserService } from '../../services/user.service';
import { MessageService } from '../../services/message-service';
import { ResponsiveSize } from '../../services/responsive-size';
import { TableCrudAdmin } from '../../components/table-crud-admin/table-crud-admin';
import { Buttonback } from '../../components/buttonback/buttonback';
import { ButtonComponent } from '../../components/button/button';
import { UserModel } from '../../models/User_Service';

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

  private cd = inject(ChangeDetectorRef);

  public isClient: boolean = true;
  public deletingIds = new Set<string>();

  ngOnInit(): void {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const type = params['type'];
      this.loadData(type === 'business' ? 'business' : 'client');
    });
  }

  private loadData(type: 'client' | 'business'): void {
    this.isClient = type === 'client';
    this.userService.loadUsers(type);
  }

  async deleteUser(user: UserModel): Promise<void> {
    const id = user.id_user!;
    if (this.deletingIds.has(id)) return;

    this.deletingIds.add(id);
    this.cd.markForCheck();
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
        tap((result) => {
          if (result !== true) {
            this.deletingIds.delete(id);
            this.cd.markForCheck();
          }
        }),
        filter((result) => result === true),
        switchMap(() =>
          from(this.userService.emptyUserStorageFolder(id)).pipe(
            switchMap(() => this.userService.deleteUser(id)),
          ),
        ),
        switchMap(() =>
          this.translate
            .get('MESSAGES.SUCCESS.DELETE_USER')
            .pipe(map((msg) => ({ text: msg, type: 'success' as const }))),
        ),
        catchError((err) => {
          console.error('Error al borrar usuario desde Admin:', err);
          return this.translate
            .get('MESSAGES.ERROR.DELETE_USER')
            .pipe(map((msg) => ({ text: msg, type: 'error' as const })));
        }),
        finalize(() => {
          this.deletingIds.delete(id);
          this.cd.markForCheck();
        }),
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

  editUser(user: UserModel): void {
    if (this.deletingIds.has(user.id_user!)) return;
    const userWithRole = {
      ...user,
      rol: this.isClient ? 'client' : 'business',
    };
    this.router.navigate(['/modify-profile'], {
      state: { user: userWithRole },
    });
  }

  createUser(): void {
    const type = this.isClient ? 'client' : 'business';
    this.router.navigate(['/register'], {
      state: { type },
    });
  }

  isDeleting(id: string): boolean {
    return this.deletingIds.has(id);
  }
}
