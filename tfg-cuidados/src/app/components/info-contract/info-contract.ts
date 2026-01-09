import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { ButtonComponent } from '../button/button';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-info-contrato',
  imports: [
    MatDialogActions,
    MatDialogContent,
    MatButtonModule,
    MatDialogModule,
    ButtonComponent,
    TranslateModule,
  ],
  templateUrl: './info-contract.html',
  styleUrl: './info-contract.css',
})
export class InfoContract {
  public data = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<InfoContract>);
  onCancelar() {
    this.dialogRef.close(true);
  }
}
