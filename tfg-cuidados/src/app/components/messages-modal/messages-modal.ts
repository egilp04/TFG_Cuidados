import { Component, inject, OnInit, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormControl,
} from '@angular/forms';
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
import { ComunicacionModel } from '../../models/Comunicacion';

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
    emisor: this.fb.control<string>(''),
    receptor: this.fb.control<string>('', [Validators.required, Validators.email]),
    asunto: this.fb.control<string>('', [Validators.required]),
    contenido: this.fb.control<string>('', [Validators.required]),
  });

  ngOnInit() {
    if (this.data.modo === 'showMessage' && this.data.contenido) {
      this.messageForm.patchValue({
        emisor: this.data.contenido.Emisor?.email,
        receptor: this.data.contenido.Receptor?.nombre,
        asunto: this.data.contenido.asunto || undefined,
        contenido: this.data.contenido.contenido,
      });
      this.messageForm.disable();
    } else if (this.data.modo === 'escribir' && this.data.receptorEmail) {
      this.messageForm.patchValue({
        receptor: this.data.receptorEmail,
      });
      this.getCtrl('receptor').disable();
    }
  }

  getCtrl(name: string): FormControl {
    return this.messageForm.get(name) as FormControl;
  }

  sendMessage() {
    if (
      this.messageForm.valid ||
      (this.data.modo === 'escribir' &&
        this.getCtrl('asunto').valid &&
        this.getCtrl('contenido').valid)
    ) {
      const idEmisor = this.authService.currentUser()?.id_usuario;
      const emailDestino = this.messageForm.getRawValue().receptor ?? '';
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
              id_receptor: foundUser.id_usuario,
              asunto: this.messageForm.value.asunto ?? "",
              contenido: this.messageForm.value.contenido ?? "",
              tipo_comunicacion: 'mensaje',
              leido: false,
            };

            return this.comunicationService.insertComunicacion(newComunication);
          }),
        )
        .subscribe({
          next: () => {
            this.messageService.showMessage(
              this.translate.instant('MESSAGES_MODAL.FEEDBACK.SEND_SUCCESS'),
              'exito',
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
