import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { inject } from '@angular/core';
import { filter, map, take } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { getHomeRouteByRole } from '../utils/routerUtils';

export const publicGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return toObservable(authService.isLoading).pipe(
    filter((loading) => !loading),
    take(1),
    map(() => {
      if (authService.isAuthenticated()) {
        const userRole = authService.userRol() ?? '';
        if (userRole === '') {
          return router.createUrlTree(['/']);
        }

        const targetRoute = getHomeRouteByRole(userRole);
        return router.createUrlTree([targetRoute]);
      }
      return true;
    }),
  );
};
