import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './button.html',
  styleUrl: './button.css',
})
export class ButtonComponent {
  label = input.required<string>();
  variant = input<'primary' | 'secondary' | 'danger'>('primary');
  type = input<'button' | 'submit' | 'reset'>('button');
  disabled = input<boolean>(false);
  onClick = output<MouseEvent>();

  buttonClass = computed(() => {
    const base =
      'text-button rounded-12 transition-all duration-200 cursor-pointer flex items-center justify-center border-2 border-transparent px-10 py-6 md:px-15 md:py-8 lg:px-20 lg:py-10 disabled:bg-disabled h-full w-full ';

    const variants = {
      primary: `bg-secondary text-surface hover:bg-accent btn-disabled-primary`,
      secondary: `bg-transparent text-primary underline hover:text-accent btn-disabled-secondary`,
      danger: `bg-red text-surface btn-disabled-primary`,
    };

    return `${base} ${variants[this.variant()]}`;
  });
}
