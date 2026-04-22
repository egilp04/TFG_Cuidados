import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  OnChanges,
  SimpleChanges,
  AfterViewInit,
  inject,
  DestroyRef,
  OnInit,
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
export class TableCrudAdmin implements OnInit, OnChanges, AfterViewInit {
  private destroyRef = inject(DestroyRef);

  @Input() mode: 'client' | 'business' = 'client';
  @Input() data: UserModel[] = [];
  @Output() deleteItem = new EventEmitter<UserModel>();
  @Output() modifyItem = new EventEmitter<UserModel>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  public dataSource = new MatTableDataSource<UserModel>([]);
  public searchControl = new FormControl('');

  ngOnInit(): void {
    this.setupFilter();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && changes['data'].currentValue) {
      this.dataSource.data = changes['data'].currentValue;
      this.refreshTableState();
    }
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  /**
   * Configura el filtro de búsqueda en tiempo real para la tabla.
   */
  private setupFilter(): void {
    this.searchControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      const filterValue = value || '';
      this.dataSource.filter = filterValue.trim().toLowerCase();
      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
      }
    });
  }

  /**
   * Actualiza el estado de la tabla y aplica el filtro de búsqueda si está activo.
   */
  private refreshTableState(): void {
    if (this.searchControl.value) {
      this.dataSource.filter = this.searchControl.value.trim().toLowerCase();
    }
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
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

  /**
   * Emite un evento de eliminación para el elemento especificado.
   * @param item El modelo de usuario a eliminar.
   */
  onDelete(item: UserModel): void {
    this.deleteItem.emit(item);
  }

  /**
   * Emite un evento de modificación para el elemento especificado.
   * @param item El modelo de usuario a modificar.
   */
  onModify(item: UserModel): void {
    this.modifyItem.emit(item);
  }
}
