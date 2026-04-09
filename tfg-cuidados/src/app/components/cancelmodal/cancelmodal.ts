import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ButtonComponent } from '../button/button';
import { TranslateModule } from '@ngx-translate/core';
import { CancelModalData } from '../../models/Cancel-Modal';

@Component({
  selector: 'app-cancelmodal',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, ButtonComponent, TranslateModule],
  templateUrl: './cancelmodal.html',
  styleUrl: './cancelmodal.css',
})
export class Cancelmodal {
  public data = inject<CancelModalData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<Cancelmodal>);

  getPrimaryLabel() {
    switch (this.data.modo) {
      case 'baja':
        return 'CANCEL_MODAL.BTN.KEEP_ACCOUNT';
      case 'cancelContract':
        return 'CANCEL_MODAL.BTN.KEEP_CONTRACT';
      default:
        return 'CANCEL_MODAL.BTN.CANCEL_ACTION';
    }
  }

  getSecondaryLabel() {
    switch (this.data.modo) {
      case 'baja':
        return 'CANCEL_MODAL.BTN.UNSUBSCRIBE';
      case 'cancelContract':
        return 'CANCEL_MODAL.BTN.CANCEL_CONTRACT';
      default:
        return 'CANCEL_MODAL.BTN.DELETE';
    }
  }

  toCancel() {
    this.dialogRef.close(true);
  }
}
