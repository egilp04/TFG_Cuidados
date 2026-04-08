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

  mensajeForm: FormGroup = this.fb.group({
    emisor: [''],
    receptor: ['', [Validators.required, Validators.email]],
    asunto: ['', [Validators.required]],
    contenido: ['', [Validators.required]],
  });

  ngOnInit() {
    if (this.data.modo === 'verMensaje' && this.data.contenido) {
      this.mensajeForm.patchValue({
        emisor: this.data.contenido.Emisor?.email,
        receptor: this.data.contenido.Receptor?.nombre,
        asunto: this.data.contenido.asunto,
        contenido: this.data.contenido.contenido,
      });
      this.mensajeForm.disable();
    } else if (this.data.modo === 'escribir' && this.data.receptorEmail) {
      this.mensajeForm.patchValue({
        receptor: this.data.receptorEmail,
      });
      this.getCtrl('receptor').disable();
    }
  }

  getCtrl(name: string): FormControl {
    return this.mensajeForm.get(name) as FormControl;
  }

  enviarMensaje() {
    if (
      this.mensajeForm.valid ||
      (this.data.modo === 'escribir' &&
        this.getCtrl('asunto').valid &&
        this.getCtrl('contenido').valid)
    ) {
      const idEmisor = this.authService.currentUser()?.id_usuario;
      const emailDestino = this.mensajeForm.getRawValue().receptor;
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
          switchMap((usuarioEncontrado) => {
            if (!usuarioEncontrado || !usuarioEncontrado.id_usuario) {
              throw new Error('usuario_no_encontrado');
            }
            const nuevaComunicacion: ComunicacionModel = {
              id_emisor: idEmisor,
              id_receptor: usuarioEncontrado.id_usuario,
              asunto: this.mensajeForm.value.asunto,
              contenido: this.mensajeForm.value.contenido,
              tipo_comunicacion: 'mensaje',
              fecha_envio: new Date(),
              leido: false,
            };

            return this.comunicationService.insertComunicacion(nuevaComunicacion);
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
