import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.css',
})
export class AvatarComponent {
  public name = input.required<string>();
  public surname = input<string | null>(null);
  public imageUrl = input<string | null>(null);

  public initials = computed(() => {
    const firstLetter = this.name().charAt(0).toUpperCase();
    const secondLetter = this.surname() ? this.surname()?.charAt(0).toUpperCase() : '';
    console.log(secondLetter);
    return `${firstLetter}${secondLetter}`;
  });

  public backgroundHsl = computed(() => {
    const stringToHash = this.name() + (this.surname() || '');
    let hash = 0;
    for (let i = 0; i < stringToHash.length; i++) {
      hash = stringToHash.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash % 360);
    return `hsl(${h}, 60%, 50%)`;
  });
}
