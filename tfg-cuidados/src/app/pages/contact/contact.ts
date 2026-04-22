import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  FormControl,
} from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import emailjs from '@emailjs/browser';
import { Inputs } from '../../components/inputs/inputs';
import { ButtonComponent } from '../../components/button/button';
import { Buttonback } from '../../components/buttonback/buttonback';
import { MessageService } from '../../services/message-service';

/**
 * Component for the public contact form.
 * Uses EmailJS to send inquiries directly to the administration.
 */
@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    Inputs,
    ButtonComponent,
    Buttonback,
    CommonModule,
    TranslateModule,
  ],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
})
export default class Contact {
  private fb = inject(FormBuilder);
  public messageService = inject(MessageService);
  private translate = inject(TranslateService);

  public contactForm = this.fb.group({
    username: this.fb.control<string>('', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]),
    email: this.fb.control<string>('', [Validators.required, Validators.email]),
    topic: this.fb.control<string>('', [Validators.required, Validators.minLength(6)]),
    message: this.fb.control<string>('', [Validators.required, Validators.minLength(6)]),
  });

  /**
   * Helper to retrieve a form control by name with proper typing.
   */
  getCtrl(name: string): FormControl {
    return this.contactForm.get(name) as FormControl;
  }

  /**
   * Validates the form and sends the email via EmailJS.
   * Handles UI states (loading/disabled) and feedback messages.
   */
  async submitContactForm(): Promise<void> {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    const formValue = this.contactForm.getRawValue();
    const templateParams = {
      username: formValue.username,
      email: formValue.email,
      topic: formValue.topic,
      message: formValue.message,
    };

    this.contactForm.disable();

    try {
      await emailjs.send(
        'service_oqks3xm',
        'template_pn792zm',
        templateParams,
        'lXKk2y0Z41TMBq3NO',
      );

      const successMsg = await lastValueFrom(this.translate.get('MESSAGES.SUCCESS.CONTACT'));
      this.messageService.showMessage(successMsg, 'success');
      this.contactForm.reset();
    } catch (error) {
      console.error('EmailJS Error:', error);
      const errorMsg = await lastValueFrom(this.translate.get('MESSAGES.ERROR.CONTACT'));
      this.messageService.showMessage(errorMsg, 'error');
    } finally {
      this.contactForm.enable();
    }
  }
}