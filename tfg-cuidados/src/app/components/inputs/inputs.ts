import { NgClass } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Reusable UI component for form inputs.
 * Supports text, email, password, date, time, and textarea types.
 * Includes built-in password visibility toggling and error message handling.
 */
@Component({
  selector: 'app-inputs',
  standalone: true,
  imports: [ReactiveFormsModule, LucideAngularModule, NgClass, TranslateModule],
  templateUrl: './inputs.html',
  styleUrl: './inputs.css',
})
export class Inputs {
  label = input.required<string>();
  type = input<'text' | 'email' | 'password' | 'date' | 'time' | 'textarea'>('text');
  name = input.required<string>();
  control = input.required<FormControl>();
  errorMessage = input<string>('');
  
  isPasswordVisible = signal(false);

  inputType = computed(() => {
    if (this.type() !== 'password') {
      return this.type();
    }
    return this.isPasswordVisible() ? 'text' : 'password';
  });

  /**
   * Toggles the visibility state of the password field.
   */
  togglePasswordVisibility(): void {
    this.isPasswordVisible.update((value) => !value);
  }
}