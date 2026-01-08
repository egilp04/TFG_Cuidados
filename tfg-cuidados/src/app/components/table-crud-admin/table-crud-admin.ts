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
  OnInit, // <--- No olvides añadir OnInit si lo usas
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
  @Input() modo: 'cliente' | 'empresa' = 'cliente';
  @Input() datos: any[] = [];
  @Output() eliminar = new EventEmitter<any>();
  @Output() modificar = new EventEmitter<any>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  dataSource = new MatTableDataSource<any>([]);
  searchControl = new FormControl('');

  ngOnInit() {
    this.searchControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((valor) => {
      const filterValue = valor || '';
      this.dataSource.filter = filterValue.trim().toLowerCase();
      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['datos'] && changes['datos'].currentValue) {
      this.dataSource.data = changes['datos'].currentValue;
      if (this.searchControl.value) {
        this.dataSource.filter = this.searchControl.value.trim().toLowerCase();
      }
      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
      }
    }
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  get displayedColumns(): string[] {
    const columnas = ['nombre'];
    if (this.modo === 'cliente') {
      columnas.push('apellidos');
    }
    columnas.push('email', 'acciones');
    return columnas;
  }

  onEliminar(item: any) {
    this.eliminar.emit(item);
  }

  onModificar(item: any) {
    this.modificar.emit(item);
  }
}
