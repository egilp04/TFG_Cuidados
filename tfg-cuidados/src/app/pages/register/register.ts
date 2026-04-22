import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { Registerform } from '../../components/registerform/registerform';
import { NavigationEnd, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MessageService } from '../../services/message-service';
import { Buttonback } from '../../components/buttonback/buttonback';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { filter, switchMap, tap, delay, catchError } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { FormSubmittedEvent } from '../../models/RegisterForm';

/**
 * Component handling the user registration flow.
 * Supports both self-registration and administrator-driven account creation.
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [Registerform, CommonModule, Buttonback, TranslateModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export default class Register implements OnInit {
  private router = inject(Router);
  public authService = inject(AuthService);
  private cd = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  public messageService = inject(MessageService);
  private translate = inject(TranslateService);
  private platformId = inject(PLATFORM_ID);

  public isClientProfile: boolean = true;

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.determineProfileType();
      });
      
    this.determineProfileType();
  }

  /**
   * Evaluates the routing state to determine if the user is registering as a Client or Business.
   */
  private determineProfileType(): void {
    if (isPlatformBrowser(this.platformId)) {
      const state = history.state as { type?: string; tipo?: string };
      const profileType = state.type || state.tipo;
      
      if (profileType) {
        this.isClientProfile = profileType !== 'business' && profileType !== 'empresa';
        this.cd.detectChanges();
      }
    }
  }

  /**
   * Processes the registration form submission.
   * Delegates to specific authentication methods based on the active user's role.
   * @param event Payload containing form data and profile type flag.
   */
  onRegister(event: FormSubmittedEvent): void {
    const user = this.authService.currentUser();
    const isAdmin = user?.rol === 'administrator';

    if (user && !isAdmin) {
      return;
    }

    const payloadData = event.data;
    const payloadIsClient = event.isClient;

    const register$ = isAdmin
      ? this.authService.registerByAdmin(payloadData, payloadIsClient)
      : this.authService.register(payloadData, payloadIsClient);

    register$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => this.translate.get('REGISTER.MESSAGES.SUCCESS')),
        tap((msg: string) => {
          this.messageService.showMessage(msg, 'success');
          this.cd.detectChanges();
        }),
        delay(2000),
        tap(() => {
          if (isAdmin) {
            const tabType = payloadIsClient ? 'client' : 'business';
            this.router.navigate(['/admin-gestion'], { queryParams: { type: tabType } });
          } else {
            this.router.navigate(['/login']);
          }
        }),
        catchError((err: Error) => {
          console.error(err);
          const errorMessage = err.message || '';
          const isEmailError = errorMessage === 'EMAIL_EXISTS' || 
                               errorMessage.includes('registered') || 
                               errorMessage.includes('registrado');
                               
          const key = isEmailError 
            ? 'REGISTER.MESSAGES.ERROR_EMAIL' 
            : 'REGISTER.MESSAGES.ERROR_GENERIC';
            
          return this.translate.get(key).pipe(
            tap((msg: string) => {
              this.messageService.showMessage(msg, 'error');
              this.cd.detectChanges();
            }),
            switchMap(() => EMPTY)
          );
        })
      )
      .subscribe();
  }
}