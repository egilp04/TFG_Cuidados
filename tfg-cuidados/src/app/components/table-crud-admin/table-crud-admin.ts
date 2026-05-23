import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  inject,
  DestroyRef,
  OnInit,
  effect,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../button/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { Searchbar } from '../searchbar/searchbar';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { UserModel } from '../../models/User_Service';

/**
 * Tabla CRUD genérica para gestión administrativa.
 * Ajusta dinámicamente las columnas basándose en el tipo de usuario (Cliente/Negocio).
 */
@Component({
  selector: 'app-table-crud-admin',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    MatTableModule,
    MatButtonModule,
    MatDialogModule,
    Searchbar,
    MatPaginatorModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
  templateUrl: './table-crud-admin.html',
  styleUrl: './table-crud-admin.css',
})
export class TableCrudAdmin implements OnInit, OnChanges {
  private destroyRef = inject(DestroyRef);

  @Input() mode: 'client' | 'business' = 'client';
  @Input() data: UserModel[] = [];
  @Output() deleteItem = new EventEmitter<UserModel>();
  @Output() modifyItem = new EventEmitter<UserModel>();
  @Input() deletingIds = new Set<string>();

  public dataSource = new MatTableDataSource<UserModel>([]);
  public searchControl = new FormControl('');

  public paginator = viewChild(MatPaginator);
  constructor() {
    effect(() => {
      const p = this.paginator();
      if (p) {
        this.dataSource.paginator = p;
      }
    });
  }

  ngOnInit(): void {
    this.setupCustomFilter();
    this.setupFilter();
  }

  /**
   * Configura el filtro de búsqueda en tiempo real para la tabla.
   */
  private setupCustomFilter(): void {
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const name = data.name || '';
      const email = data.email || '';
      const dataStr = `${name} ${email}`.toLowerCase();
      return dataStr.includes(filter);
    };
  }

  private setupFilter(): void {
    this.searchControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      const filterValue = value || '';
      this.dataSource.filter = filterValue.trim().toLowerCase();
      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && changes['data'].currentValue) {
      this.dataSource.data = changes['data'].currentValue;
      this.refreshTableState();
    }
  }

  /**
   * Actualiza el estado de la tabla y aplica el filtro de búsqueda si está activo.
   */
  private refreshTableState(): void {
    if (this.searchControl.value) {
      this.dataSource.filter = this.searchControl.value.trim().toLowerCase();
    }
    const paginatorInner = this.dataSource.paginator;
    if (paginatorInner) {
      const totalPaginas = Math.ceil(this.dataSource.filteredData.length / paginatorInner.pageSize);
      if (paginatorInner.pageIndex >= totalPaginas && this.dataSource.data.length > 0) {
        paginatorInner.firstPage();
      }
    }
  }

  get displayedColumns(): string[] {
    const columns = ['name'];
    if (this.mode === 'client') {
      columns.push('surnames');
    }
    columns.push('email', 'actions');
    return columns;
  }

  isDeleting(id?: string): boolean {
    if (!id) return false;
    return this.deletingIds.has(id);
  }

  /**
   * Emite un evento de eliminación para el elemento especificado.
   * @param item El modelo de usuario a eliminar.
   */
  onDelete(item: UserModel): void {
    if (!item.id_user || this.deletingIds.has(item.id_user)) return;
    this.deleteItem.emit(item);
  }

  /**
   * Emite un evento de modificación para el elemento especificado.
   * @param item El modelo de usuario a modificar.
   */
  onModify(item: UserModel): void {
    if (!item.id_user || this.deletingIds.has(item.id_user)) return;
    this.modifyItem.emit(item);
  }
}
