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
  title = input.required<string>();
  description = input.required<string>();
  image = input.required<string>();
  charge = input<string>();
}
