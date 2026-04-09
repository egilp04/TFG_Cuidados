import { Component, computed, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
@Component({
  selector: 'app-cards-landing',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './cards-landing.html',
  styleUrl: './cards-landing.css',
})
export class CardsLanding {
  titulo = input.required<string>();
  descripcion = input.required<string>();
  imagen = input.required<string>();
  cargo = input<string>();
}
