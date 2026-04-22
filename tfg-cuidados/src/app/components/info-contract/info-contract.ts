import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogContent,
  MatDialogModule,
} from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { CloseBtnComponent } from '../close-btn/close-btn.component';
import { ContractDetail } from '../../models/ContractModel';

/**
 * Modal component to display detailed information about a specific contract.
 * Separates data into general contract details and activity/actor information.
 */
@Component({
  selector: 'app-info-contract',
  standalone: true,
  imports: [
    MatDialogContent, 
    MatButtonModule, 
    MatDialogModule, 
    TranslateModule, 
    CloseBtnComponent
  ],
  templateUrl: './info-contract.html',
  styleUrl: './info-contract.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InfoContract {
  // Strongly type the injected dialog data
  public data = inject<{ contract: ContractDetail }>(MAT_DIALOG_DATA);
}