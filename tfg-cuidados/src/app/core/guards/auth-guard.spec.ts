import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard } from './auth-guard';
import { AuthService } from '../../services/auth.service';
import { signal } from '@angular/core';
import { Observable } from 'rxjs';
declare var jasmine: any;

describe('authGuard', () => {
  let authServiceMock: any;
  let routerMock: any;

  beforeEach(() => {
    authServiceMock = {
      isLoading: signal(false),
      isAuthenticated: jasmine.createSpy('isAuthenticated'),
    };

    routerMock = {
      createUrlTree: jasmine.createSpy('createUrlTree').and.returnValue('REDIRECT_URL' as any),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });
  });

  it('should allow navigation if user is authenticated and not loading', (done: any) => {
    authServiceMock.isLoading.set(false);
    authServiceMock.isAuthenticated.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    if (result instanceof Observable) {
      result.subscribe((value) => {
        expect(value).toBe(true);
        done();
      });
    }
  });

  it('should redirect to / if user is NOT authenticated and not loading', (done: any) => {
    authServiceMock.isLoading.set(false);
    authServiceMock.isAuthenticated.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    if (result instanceof Observable) {
      result.subscribe((value) => {
        expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/']);
        expect(value).toBe('REDIRECT_URL' as any);
        done();
      });
    }
  });

  it('should wait for loading to finish before making a decision', (done: any) => {
    authServiceMock.isLoading.set(true);
    authServiceMock.isAuthenticated.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    let emitted = false;

    if (result instanceof Observable) {
      result.subscribe((value) => {
        emitted = true;
        expect(value).toBe(true);
        done();
      });
    }

    expect(emitted).toBe(false);

    authServiceMock.isLoading.set(false);
  });
});
