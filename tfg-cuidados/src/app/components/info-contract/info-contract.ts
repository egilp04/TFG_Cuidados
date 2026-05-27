import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogContent, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { CloseBtnComponent } from '../close-btn/close-btn.component';
import { ContractDetail } from '../../models/ContractModel';

/**
 * Componente modal para mostrar información detallada sobre un contrato específico.
 * Separa los datos en detalles generales del contrato e información de actividad/actor.
 */
@Component({
  selector: 'app-info-contract',
  standalone: true,
  imports: [MatDialogContent, MatButtonModule, MatDialogModule, TranslateModule, CloseBtnComponent],
  templateUrl: './info-contract.html',
  styleUrl: './info-contract.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoContract {
  public data = inject<{ contract: ContractDetail }>(MAT_DIALOG_DATA);
}
