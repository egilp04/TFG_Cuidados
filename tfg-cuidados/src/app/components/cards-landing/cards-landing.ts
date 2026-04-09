import { Component, computed, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { NgOptimizedImage } from '@angular/common';
@Component({
  selector: 'app-cards-landing',
  standalone: true,
  imports: [TranslateModule, NgOptimizedImage],
  templateUrl: './cards-landing.html',
  styleUrl: './cards-landing.css',
})
export class CardsLanding {
  titulo = input.required<string>();
  descripcion = input.required<string>();
  imagen = input.required<string>();
  cargo = input<string>();
  public cardClasses = computed(() => {
    const base = 'p-20 shadow-soft flex flex-col flex flex-col gap-2 min-h-40 lg:min-h-48 w-full';
    const cargo = this.cargo() ? 'lg:h-64' : 'xl:h-48';
    return `${base} ${cargo}`;
  });
}
