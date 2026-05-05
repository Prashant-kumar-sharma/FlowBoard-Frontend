import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();
  const user = auth.getCurrentUser();

  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        ...(user ? {
          'X-User-Id': user.id.toString(),
          'X-User-Role': user.role
        } : {})
      }
    });
    return next(cloned);
  }
  return next(req);
};
