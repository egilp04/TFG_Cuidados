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

  messageForm = this.fb.group({
    sender: this.fb.control<string>(''),
    receiver: this.fb.control<string>('', [Validators.required, Validators.email]),
    topic: this.fb.control<string>('', [Validators.required]),
    content: this.fb.control<string>('', [Validators.required]),
  });

  ngOnInit() {
    if (this.data.mode === 'showMessage' && this.data.contenido) {
      this.messageForm.patchValue({
        sender: this.data.contenido.Emisor?.email,
        receiver: this.data.contenido.Receptor?.nombre,
        topic: this.data.contenido.asunto || undefined,
        content: this.data.contenido.contenido,
      });
      this.messageForm.disable();
    } else if (this.data.mode === 'escribir' && this.data.receptorEmail) {
      this.messageForm.patchValue({
        receiver: this.data.receptorEmail,
      });
      this.getCtrl('receiver').disable();
    }
  }

  getCtrl(name: string): FormControl {
    return this.messageForm.get(name) as FormControl;
  }

  sendMessage() {
    if (
      this.messageForm.valid ||
      (this.data.mode === 'escribir' &&
        this.getCtrl('asunto').valid &&
        this.getCtrl('contenido').valid)
    ) {
      const idEmisor = this.authService.currentUser()?.id_usuario;
      const emailDestino = this.messageForm.getRawValue().receiver ?? '';
      if (!idEmisor) {
        this.messageService.showMessage(
          this.translate.instant('MESSAGES_MODAL.FEEDBACK.ERROR_SENDER'),
          'error',
        );
        this.cd.markForCheck();
        return;
      }
      this.userService
        .getUserByEmail(emailDestino)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          switchMap((foundUser) => {
            if (!foundUser || !foundUser.id_usuario) {
              throw new Error('usuario_no_encontrado');
            }
            const newComunication = {
              id_emisor: idEmisor,
              id_receiver: foundUser.id_usuario,
              asunto: this.messageForm.value.topic ?? '',
              contenido: this.messageForm.value.content ?? '',
              tipo_comunicacion: 'mensaje' as const,
              leido: false,
            };

            return this.comunicationService.insertComunication(newComunication);
          }),
        )
        .subscribe({
          next: () => {
            this.messageService.showMessage(
              this.translate.instant('MESSAGES_MODAL.FEEDBACK.SEND_SUCCESS'),
              'sucess',
            );
            this.dialogRef.close();
            this.cd.markForCheck();
          },
          error: (err: Error) => {
            const msg =
              err.message === 'usuario_no_encontrado'
                ? this.translate.instant('MESSAGES_MODAL.FEEDBACK.USER_NOT_FOUND')
                : this.translate.instant('MESSAGES_MODAL.FEEDBACK.SEND_ERROR');

            this.messageService.showMessage(msg, 'error');
            console.error(err);
            this.cd.markForCheck();
          },
        });
    }
  }
}
