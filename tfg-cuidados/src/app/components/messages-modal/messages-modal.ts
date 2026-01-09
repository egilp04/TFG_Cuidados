import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Inputs } from '../inputs/inputs';
import { ButtonComponent } from '../button/button';
import {
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
  FormBuilder,
} from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ComunicacionModel } from '../../models/Comunicacion';
import { ComunicationService } from '../../services/comunication.service';
import { UserService } from '../../services/user.service';
import { MessageService } from '../../services/message-service';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core'; // <--- 1. IMPORTAR

@Component({
  selector: 'app-messages-modal',
  standalone: true,
  imports: [
    Inputs,
    ButtonComponent,
    ReactiveFormsModule,
    CommonModule,
    TranslateModule,
    MatDialogModule,
  ],
  templateUrl: './messages-modal.html',
  styleUrl: './messages-modal.css',
})
export class MessagesModal implements OnInit {
  public data = inject(MAT_DIALOG_DATA);
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
        emisor: this.data.contenido.Emisor?.nombre,
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
          'error'
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
          })
        )
        .subscribe({
          next: () => {
            this.messageService.showMessage(
              this.translate.instant('MESSAGES_MODAL.FEEDBACK.SEND_SUCCESS'),
              'exito'
            );
            this.dialogRef.close();
            this.cd.markForCheck();
          },
          error: (err: any) => {
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
