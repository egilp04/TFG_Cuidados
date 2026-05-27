import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import * as QRCode from 'qrcode';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService } from '../../services/message-service';
@Component({
  selector: 'app-authentificator',
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './authentificator.component.html',
  styleUrl: './authentificator.component.css',
})
export class AuthentificatorComponent {
  private authService = inject(AuthService);
  public messageService = inject(MessageService);
  private translate = inject(TranslateService);

  step = signal<1 | 2 | 3>(1);
  isLoading = signal(false);
  qrCodeUrl = signal('');

  private factorId = '';
  private challengeId = '';
  verificationCode = '';

  async ngOnInit() {
    try {
      const factors = await this.authService.getVerifiedFactors();
      if (factors && factors.length > 0) {
        this.factorId = factors[0].id;
        this.step.set(3);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async initMfa() {
    try {
      this.isLoading.set(true);
      const enrollData = await this.authService.start2FAEnrollment();
      this.factorId = enrollData.id;
      const qrDataUrl = await QRCode.toDataURL(enrollData.totp.uri);
      this.qrCodeUrl.set(qrDataUrl);

      const challengeData = await this.authService.createChallenge(this.factorId);
      this.challengeId = challengeData.id;

      this.step.set(2);
    } catch (error) {
      this.messageService.showMessage(
        this.translate.instant('TWO_FACTOR_AUTH.ERROR_GENERATE_QR'),
        'error',
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  async verifyAndEnable() {
    if (this.verificationCode.length !== 6) return;

    try {
      this.isLoading.set(true);
      await this.authService.verifyChallenge(
        this.factorId,
        this.challengeId,
        this.verificationCode,
      );
      this.step.set(3);
      this.verificationCode = '';
    } catch (error) {
      this.messageService.showMessage(
        this.translate.instant('TWO_FACTOR_AUTH.ERROR_WRONG_CODE'),
        'error',
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  async disableMfa() {
    const confirmMessage = this.translate.instant('TWO_FACTOR_AUTH.CONFIRM_DISABLE');

    if (confirm(confirmMessage)) {
      try {
        await this.authService.unenroll2FA(this.factorId);
        this.step.set(1);
        this.factorId = '';
        this.messageService.showMessage(
          this.translate.instant('TWO_FACTOR_AUTH.SUCCESS_DISABLE'),
          'success',
        );
      } catch (e) {
        console.error(e);
        this.messageService.showMessage(
          this.translate.instant('TWO_FACTOR_AUTH.ERROR_DISABLE'),
          'error',
        );
      }
    }
  }
}
