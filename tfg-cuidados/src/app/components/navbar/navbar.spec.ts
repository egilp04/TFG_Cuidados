import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Navbar } from './navbar';
import { TranslateModule } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../services/auth.service';
import { ComunicationService } from '../../services/comunication.service';
import { of } from 'rxjs';

import { LucideAngularModule, Menu, X, Mail, Bell, User } from 'lucide-angular';

describe('Navbar', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;

  const authServiceMock = {
    currentUser: () => null,
    isAuthenticated: () => false,
    signOut: () => of(true),
  };

  const comunicationServiceMock = {
    refreshUsersData: () => {},
    getUnreadMessagesCount: () => of(0),
    getUnreadNotificationsCount: () => of(0),
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
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: ComunicationService, useValue: comunicationServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
