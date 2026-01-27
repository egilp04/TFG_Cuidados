import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Footer } from './footer';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../services/auth.service';

declare var jasmine: any;
declare var spyOn: any;
declare var localStorage: any;

describe('Footer', () => {
  let component: Footer;
  let fixture: ComponentFixture<Footer>;
  let translateServiceSpy: any;
  let authServiceSpy: any;

  beforeEach(async () => {
    const authServiceMock = {
      isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(false),
    };

    await TestBed.configureTestingModule({
      imports: [Footer, TranslateModule.forRoot()],
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(Footer);
    component = fixture.componentInstance;

    translateServiceSpy = TestBed.inject(TranslateService);
    authServiceSpy = TestBed.inject(AuthService);

    spyOn(translateServiceSpy, 'use');
    spyOn(localStorage, 'setItem');

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set homeLink to / when not authenticated', () => {
    expect(component.homeLink()).toBe('/');
  });

  it('should set homeLink to /home when authenticated', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);

    fixture = TestBed.createComponent(Footer);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.homeLink()).toBe('/home');
  });

  it('should change language and save to localStorage', () => {
    const lang = 'en';
    component.cambiarIdioma(lang);
    expect(translateServiceSpy.use).toHaveBeenCalledWith(lang);
    expect(localStorage.setItem).toHaveBeenCalledWith('idioma_seleccionado', lang);
  });
});
