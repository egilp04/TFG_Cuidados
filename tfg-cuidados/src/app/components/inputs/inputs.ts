import { NgClass } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Componente de interfaz de usuario reutilizable para entradas de formulario.
 * Soporta tipos text, email, password, date, time y textarea.
 * Incluye alternancia integrada de visibilidad de contraseña y manejo de mensajes de error.
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
   * Alterna el estado de visibilidad del campo de contraseña.
   */
  togglePasswordVisibility(): void {
    this.isPasswordVisible.update((value) => !value);
  }
}
