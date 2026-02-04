import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoContract } from './info-contract';
import { TranslateModule } from '@ngx-translate/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

describe('InfoContract', () => {
  let component: InfoContract;
  let fixture: ComponentFixture<InfoContract>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfoContract, TranslateModule.forRoot()],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: { close: () => {} } },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            contrato: { id_contrato: 1, servicio: 'Limpieza', estado: 'activo' },
            rol: 'cliente',
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InfoContract);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
