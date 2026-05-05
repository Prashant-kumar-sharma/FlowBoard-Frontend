import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (!authService.isLoggedIn()) {
    router.navigate(['/auth/login']);
    return false;
  }
  if (authService.isSuspended()) {
    router.navigate(['/account-suspended']);
    return false;
  }
  return true;
};
