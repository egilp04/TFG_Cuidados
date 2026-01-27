import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Navbar } from './navbar';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../services/auth.service';
import { ComunicationService } from '../../services/comunication.service';
import { of } from 'rxjs';
import { LucideAngularModule, Menu, X, Mail, Bell, User } from 'lucide-angular';
declare var jasmine: any;
declare var spyOn: any;

describe('Navbar', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;
  let authServiceSpy: any;
  let routerSpy: any;
  let dialogSpy: any;
  let comunicationServiceSpy: any;
  const dialogRefMock = {
    afterClosed: () => of({ loginSuccess: true }),
  };

  const authServiceMock = {
    currentUser: () => ({ id: '123', email: 'test@test.com' }),
    isAuthenticated: () => true,
    signOut: () => of(true),
  };

  const comunicationServiceMock = {
    refreshUsersData: jasmine.createSpy('refreshUsersData'),
    getUnreadMessagesCount: () => of(2),
    getUnreadNotificationsCount: () => of(0),
  };

  const routerMock = {
    navigate: jasmine.createSpy('navigate'),
  };

  const dialogMock = {
    open: jasmine.createSpy('open').and.returnValue(dialogRefMock),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Navbar,
        TranslateModule.forRoot(),
        MatDialogModule,
        LucideAngularModule.pick({ Menu, X, Mail, Bell, User }),
      ],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: ComunicationService, useValue: comunicationServiceMock },
        { provide: MatDialog, useValue: dialogMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;

    authServiceSpy = TestBed.inject(AuthService);
    routerSpy = TestBed.inject(Router);
    dialogSpy = TestBed.inject(MatDialog);
    comunicationServiceSpy = TestBed.inject(ComunicationService);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle mobile menu', () => {
    expect(component.isMenuOpen).toBe(false);
    component.toggleMenu();
    expect(component.isMenuOpen).toBe(true);
    component.toggleMenu();
    expect(component.isMenuOpen).toBe(false);
  });

  it('should close menu when navigating home', () => {
    component.isMenuOpen = true;
    component.backHome();
    expect(component.isMenuOpen).toBe(false);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('should call logout and navigate to root', () => {
    spyOn(authServiceSpy, 'signOut').and.returnValue(of(true));
    component.logout();
    expect(authServiceSpy.signOut).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should navigate to modify profile', () => {
    component.modificarPerfil();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/modify-profile']);
  });

  it('should open register dialog', () => {
    component.registrarse();
    expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.any(Function), {
      data: { modo: 'registro' },
      width: '500px',
    });
  });

  it('should navigate to messages when type is mensajes', () => {
    component.verComunicaciones('mensajes');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/messages']);
  });

  it('should navigate to notifications when type is notificaciones', () => {
    component.verComunicaciones('notificaciones');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/notifications']);
  });

  it('should open login dialog and refresh data on success', () => {
    component.iniciarSesion();

    expect(dialogSpy.open).toHaveBeenCalled();
    expect(comunicationServiceSpy.refreshUsersData).toHaveBeenCalled();
  });
});
