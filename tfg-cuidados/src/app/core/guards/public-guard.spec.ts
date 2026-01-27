import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { publicGuard } from './public-guard';
import { AuthService } from '../../services/auth.service';
import { signal } from '@angular/core';
import { Observable } from 'rxjs';
declare var jasmine: any;

describe('publicGuard', () => {
  let authServiceMock: any;
  let routerMock: any;

  beforeEach(() => {
    authServiceMock = {
      isLoading: signal(false),
      isAuthenticated: jasmine.createSpy('isAuthenticated'),
    };

    routerMock = {
      createUrlTree: jasmine.createSpy('createUrlTree').and.returnValue('REDIRECT_HOME' as any),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });
  });
  it('should allow navigation if user is NOT authenticated', (done: any) => {
    authServiceMock.isLoading.set(false);
    authServiceMock.isAuthenticated.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() => publicGuard({} as any, {} as any));

    if (result instanceof Observable) {
      result.subscribe((value) => {
        expect(value).toBe(true);
        done();
      });
    }
  });

  it('should redirect to /home if user IS authenticated', (done: any) => {
    authServiceMock.isLoading.set(false);
    authServiceMock.isAuthenticated.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() => publicGuard({} as any, {} as any));

    if (result instanceof Observable) {
      result.subscribe((value) => {
        expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/home']);
        expect(value).toBe('REDIRECT_HOME' as any);
        done();
      });
    }
  });

  it('should wait for loading to finish', (done: any) => {
    authServiceMock.isLoading.set(true);
    authServiceMock.isAuthenticated.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() => publicGuard({} as any, {} as any));

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
