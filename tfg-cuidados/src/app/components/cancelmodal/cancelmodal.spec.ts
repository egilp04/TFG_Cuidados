import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Cancelmodal } from './cancelmodal';
import { TranslateModule } from '@ngx-translate/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

declare var jasmine: any;

describe('Cancelmodal', () => {
  let component: Cancelmodal;
  let fixture: ComponentFixture<Cancelmodal>;
  let dialogRefSpy: any;

  const mockDialogRef = {
    close: jasmine.createSpy('close'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Cancelmodal, TranslateModule.forRoot()],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: mockDialogRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Cancelmodal);
    component = fixture.componentInstance;
    dialogRefSpy = TestBed.inject(MatDialogRef);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return correct labels for baja mode', () => {
    component.data = { mode: 'unsubscribe' };
    expect(component.getPrimaryLabel()).toBe('CANCEL_MODAL.BTN.KEEP_ACCOUNT');
    expect(component.getSecondaryLabel()).toBe('CANCEL_MODAL.BTN.UNSUBSCRIBE');
  });

  it('should return correct labels for cancelContract mode', () => {
    component.data = { mode: 'cancelContract' };
    expect(component.getPrimaryLabel()).toBe('CANCEL_MODAL.BTN.KEEP_CONTRACT');
    expect(component.getSecondaryLabel()).toBe('CANCEL_MODAL.BTN.CANCEL_CONTRACT');
  });
});
