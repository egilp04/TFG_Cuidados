import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCrudAdmin } from './table-crud-admin';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule, Search } from 'lucide-angular';

describe('TableCrudAdmin', () => {
  let component: TableCrudAdmin;
  let fixture: ComponentFixture<TableCrudAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableCrudAdmin, TranslateModule.forRoot(), LucideAngularModule.pick({ Search })],
    }).compileComponents();

    fixture = TestBed.createComponent(TableCrudAdmin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
