import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth = inject(AuthService);
  const isAuthRequest =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/register') ||
    req.url.includes('/auth/refresh') ||
    req.url.includes('/oauth2/');

  return next(req).pipe(
    catchError(err => {
      if (auth.isSuspendedError(err)) {
        auth.markSuspended();
        if (router.url !== '/account-suspended') {
          router.navigate(['/account-suspended']);
        }
        return throwError(() => err);
      }
      if (err.status === 401 && !isAuthRequest) {
        auth.logout(false);
        if (!router.url.startsWith('/auth/')) {
          router.navigate(['/auth/login']);
        }
      }
      if (err.status === 403) {
        router.navigateByUrl(auth.getHomeRoute());
      }
      return throwError(() => err);
    })
  );
};
