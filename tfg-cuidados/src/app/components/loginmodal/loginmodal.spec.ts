import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Loginmodal } from './loginmodal';
import { TranslateModule } from '@ngx-translate/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Eye, EyeOff, LucideAngularModule } from 'lucide-angular';

describe('Loginmodal', () => {
  let component: Loginmodal;
  let fixture: ComponentFixture<Loginmodal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Loginmodal, TranslateModule.forRoot(), LucideAngularModule.pick({ Eye, EyeOff })],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: { close: () => {} } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Loginmodal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
