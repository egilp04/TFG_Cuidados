import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Cancelmodal } from './cancelmodal';
import { TranslateModule } from '@ngx-translate/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

describe('Cancelmodal', () => {
  let component: Cancelmodal;
  let fixture: ComponentFixture<Cancelmodal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Cancelmodal, TranslateModule.forRoot()],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: { close: () => {} } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Cancelmodal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
