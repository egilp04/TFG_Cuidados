import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule, Search } from 'lucide-angular';

@Component({
  selector: 'app-searchbar',
  standalone: true,
  imports: [LucideAngularModule, CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './searchbar.html',
  styleUrl: './searchbar.css',
})
export class Searchbar {
  @Input({ required: true }) control!: FormControl;
  @Output() searchEvent = new EventEmitter<string>();
  onInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchEvent.emit(value);
  }
}
