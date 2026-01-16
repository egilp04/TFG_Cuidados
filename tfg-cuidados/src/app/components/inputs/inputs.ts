import { Component, computed, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
@Component({
  selector: 'app-inputs',
  standalone: true,
  imports: [ReactiveFormsModule, LucideAngularModule],
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

  togglePasswordVisibility() {
    this.isPasswordVisible.update((value) => !value);
  }
}
