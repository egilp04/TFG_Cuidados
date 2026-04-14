import { Component, inject } from '@angular/core';
import { ThemeMode } from '../../services/theme-mode';
import { NgClass } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-dark-mode-btn',
  imports: [NgClass, TranslateModule],
  templateUrl: './dark-mode-btn.component.html',
  styleUrl: './dark-mode-btn.component.css',
})
export class DarkModeBtnComponent {
  public themeService = inject(ThemeMode);
  darkmode = this.themeService.isDarkMode;
}
