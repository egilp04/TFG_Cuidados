import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
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
export class Contact {
  private fb = inject(FormBuilder);
  public messageService = inject(MessageService);
  private translate = inject(TranslateService);

  contactForm: FormGroup = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    subject: ['', [Validators.required, Validators.minLength(6)]],
    message: ['', [Validators.required, Validators.minLength(6)]],
  });

  getCtrl(name: string): FormControl {
    return this.contactForm.get(name) as FormControl;
  }
  async onContactar() {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    const templateParams = {
      username: this.contactForm.value.username,
      email: this.contactForm.value.email,
      subject: this.contactForm.value.subject,
      message: this.contactForm.value.message,
    };
    this.contactForm.disable();

    try {
      await emailjs.send(
        'service_oqks3xm',
        'template_pn792zm',
        templateParams,
        'lXKk2y0Z41TMBq3NO'
      );
      const msg = await lastValueFrom(this.translate.get('MESSAGES.SUCCESS.CONTACT'));
      this.messageService.showMessage(msg, 'exito');
      this.contactForm.reset();
    } catch (error) {
      console.error('Error:', error);
      const msg = await lastValueFrom(this.translate.get('MESSAGES.ERROR.CONTACT'));
      this.messageService.showMessage(msg, 'error');
    } finally {
      this.contactForm.enable();
    }
  }
}
