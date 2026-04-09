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
import { UserModel } from '../../models/User-Service';

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
  @Input() data: UserModel[] = [];
  @Output() deleteData = new EventEmitter<UserModel>();
  @Output() modifyData = new EventEmitter<UserModel>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  dataSource = new MatTableDataSource<UserModel>([]);
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
    if (changes['data'] && changes['data'].currentValue) {
      this.dataSource.data = changes['data'].currentValue;
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

  onDeleteItem(item: UserModel) {
    this.deleteData.emit(item);
  }

  onModifyItem(item: UserModel) {
    this.modifyData.emit(item);
  }
}
