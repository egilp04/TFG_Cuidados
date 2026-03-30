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
    const variants = {
      primary: `bg-secondary text-surface hover:bg-accent btn-disabled-primary`,
      secondary: `bg-transparent text-primary underline hover:text-accent btn-disabled-secondary`,
      danger: `bg-red text-surface btn-disabled-primary`,
    };

    return `button-base ${variants[this.variant()]}`;
  });
}
