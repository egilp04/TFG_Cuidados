import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './dropdown.html',
  styleUrl: './dropdown.css',
})
export class Dropdown {
  @Input() label: string = 'SELECT.SELECT';
  @Input() options: string[] = [];

  @Output() onSelect = new EventEmitter<string>();

  isOpen: boolean = false;
  selectedOption: string | null = null;

  toggleDropdown() {
    console.log(this.options);

    this.isOpen = !this.isOpen;
  }

  selectOption(option: string) {
    this.selectedOption = option;
    this.isOpen = false;
    this.onSelect.emit(option);
  }
}
