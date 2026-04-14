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
  ariaLabel = input<string>('');
  label = input.required<string>();
  variant = input<'primary' | 'secondary' | 'danger'>('primary');
  type = input<'button' | 'submit' | 'reset'>('button');
  disabled = input<boolean>(false);
  onClick = output<MouseEvent>();

  buttonClass = computed(() => {
    const variants = {
      primary: `btn-primary`,
      secondary: `btn-secondary`,
      danger: `btn-danger`,
    };
    return `button-base ${variants[this.variant()]} disabled:btn-disabled`;
  });
}
