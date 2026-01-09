import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceTimeModal } from './service-time-modal';
import { TranslateModule } from '@ngx-translate/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ChevronDown, LucideAngularModule } from 'lucide-angular';

describe('ServiceTimeModal', () => {
  let component: ServiceTimeModal;
  let fixture: ComponentFixture<ServiceTimeModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ServiceTimeModal,
        TranslateModule.forRoot(),
        LucideAngularModule.pick({ ChevronDown }),
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: { close: () => {} } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceTimeModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
