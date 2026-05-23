import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return toObservable(authService.isLoading).pipe(
    filter((loading) => !loading),
    take(1),
    map(() => {
      if (!authService.isAuthenticated()) {
        return router.createUrlTree(['/']);
      }
      const allowedRoles = route.data['roles'] as Array<string>;
      if (allowedRoles) {
        const currentUserRole = authService.userRol() ?? '';
        if (!allowedRoles.includes(currentUserRole)) {
          return router.createUrlTree(['/landing']);
        }
      }
      return true;
    }),
  );
};
