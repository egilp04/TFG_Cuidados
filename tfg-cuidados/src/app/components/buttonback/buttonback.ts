import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core'; // <--- 1. IMPORTAR

@Component({
  selector: 'app-buttonback',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './buttonback.html',
  styleUrl: './buttonback.css',
})
export class Buttonback {
  private location = inject(Location);
  goBack(): void {
    this.location.back();
  }
}
