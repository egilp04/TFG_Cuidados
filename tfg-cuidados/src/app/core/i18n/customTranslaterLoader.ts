import { HttpClient } from '@angular/common/http';
import { TranslateLoader } from '@ngx-translate/core';
import { Observable } from 'rxjs';

export interface TranslationSchema {
  [key: string]: string | TranslationSchema;
}

export class CustomTranslateLoader implements TranslateLoader {
  constructor(private http: HttpClient) {}

  public getTranslation(lang: string): Observable<TranslationSchema> {
    return this.http.get<any>(`./assets/i18n/${lang}.json`);
  }
}
