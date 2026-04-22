import { Component, inject, OnInit, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';

import { AuthService } from '../../services/auth.service';
import { ComunicationService } from '../../services/comunication.service';
import { UserService } from '../../services/user.service';
import { MessageService } from '../../services/message-service';
import { Inputs } from '../inputs/inputs';
import { ButtonComponent } from '../button/button';
import { MessagesModalData } from '../../models/Message-Modal';
import { CloseBtnComponent } from '../close-btn/close-btn.component';

/**
 * Modal component for displaying or composing messages.
 * Handles user search by email to establish communication.
 */
@Component({
  selector: 'app-messages-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    ReactiveFormsModule,
    TranslateModule,
    Inputs,
    ButtonComponent,
    CloseBtnComponent,
  ],
  templateUrl: './messages-modal.html',
  styleUrl: './messages-modal.css',
})
export class MessagesModal implements OnInit {
  public data = inject<MessagesModalData>(MAT_DIALOG_DATA);

  private dialogRef = inject(MatDialogRef<MessagesModal>);
  private fb = inject(FormBuilder);
  private cd = inject(ChangeDetectorRef);
  private authService = inject(AuthService);
  private comunicationService = inject(ComunicationService);
  private userService = inject(UserService);
  private destroyRef = inject(DestroyRef);
  public messageService = inject(MessageService);
  private translate = inject(TranslateService);

  public messageForm = this.fb.group({
    sender: this.fb.control<string>(''),
    receiver: this.fb.control<string>('', [Validators.required, Validators.email]),
    topic: this.fb.control<string>('', [Validators.required]),
    content: this.fb.control<string>('', [Validators.required]),
  });

  ngOnInit(): void {
    if (this.data.mode === 'readMessage' && this.data.content) {
      this.messageForm.patchValue({
        sender: this.data.content.Sender?.email,
        receiver: this.data.content.Receiver?.name || this.data.content.Receiver?.email,
        topic: this.data.content.topic || undefined,
        content: this.data.content.content,
      });
      this.messageForm.disable();
    } else if (this.data.mode === 'writeMessage' && this.data.receiverEmail) {
      this.messageForm.patchValue({
        receiver: this.data.receiverEmail,
      });
      this.getCtrl('receiver').disable();
    }
  }

  /**
   * Helper to get a form control by name with type safety.
   */
  getCtrl(name: string): FormControl {
    return this.messageForm.get(name) as FormControl;
  }

  /**
   * Orchestrates the process of finding the receiver and inserting the communication record.
   */
  sendMessage(): void {
    if (this.messageForm.invalid) {
      this.messageForm.markAllAsTouched();
      return;
    }

    const currentUserId = this.authService.currentUser()?.id_user;
    const targetEmail = this.messageForm.getRawValue().receiver ?? '';

    if (!currentUserId) {
      this.messageService.showMessage(
        this.translate.instant('MESSAGES_MODAL.FEEDBACK.ERROR_SENDER'),
        'error',
      );
      return;
    }

    this.userService
      .getUserByEmail(targetEmail)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((foundUser) => {
          if (!foundUser || !foundUser.id_user) {
            throw new Error('user_not_found');
          }

          const newCommunication = {
            id_sender: currentUserId,
            id_receiver: foundUser.id_user,
            topic: this.messageForm.value.topic ?? '',
            content: this.messageForm.value.content ?? '',
            type_comunication: 'message' as const, 
            read: false,                        
          };

          return this.comunicationService.insertComunication(newCommunication);
        }),
      )
      .subscribe({
        next: () => {
          this.messageService.showMessage(
            this.translate.instant('MESSAGES_MODAL.FEEDBACK.SEND_SUCCESS'),
            'success',
          );
          this.dialogRef.close();
          this.cd.markForCheck();
        },
        error: (err: Error) => {
          const msg =
            err.message === 'user_not_found'
              ? this.translate.instant('MESSAGES_MODAL.FEEDBACK.USER_NOT_FOUND')
              : this.translate.instant('MESSAGES_MODAL.FEEDBACK.SEND_ERROR');

          this.messageService.showMessage(msg, 'error');
          console.error('Error sending message:', err);
          this.cd.markForCheck();
        },
      });
  }
}