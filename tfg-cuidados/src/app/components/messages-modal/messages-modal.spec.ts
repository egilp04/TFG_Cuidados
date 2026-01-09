import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessagesModal } from './messages-modal';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

describe('MessagesModal', () => {
  let component: MessagesModal;
  let fixture: ComponentFixture<MessagesModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessagesModal, TranslateModule.forRoot()],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: { close: () => {} } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MessagesModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
