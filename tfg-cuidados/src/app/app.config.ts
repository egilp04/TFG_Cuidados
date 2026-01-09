import {
  ApplicationConfig,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling, withRouterConfig } from '@angular/router';
import {
  LucideAngularModule,
  Mail,
  Bell,
  User,
  Search,
  ChevronDown,
  Eye,
  EyeOff,
} from 'lucide-angular';
import { LOCALE_ID } from '@angular/core';
import localeEs from '@angular/common/locales/es';
import { registerLocaleData } from '@angular/common';
import { routes } from './app.routes';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { CustomTranslateLoader } from './core/i18n/customTranslaterLoader';

registerLocaleData(localeEs);

export function createTranslateLoader(http: HttpClient) {
  return new CustomTranslateLoader(http);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: LOCALE_ID, useValue: 'es-ES' },
    provideZonelessChangeDetection(),
    provideHttpClient(withInterceptorsFromDi()),
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      }),
      withRouterConfig({
        onSameUrlNavigation: 'reload',
      })
    ),
    importProvidersFrom(
      LucideAngularModule.pick({ Mail, Bell, User, Search, ChevronDown, Eye, EyeOff })
    ),
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: createTranslateLoader,
          deps: [HttpClient],
        },
      })
    ),
  ],
};
