import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { adminGuard } from './admin.guard';
import { AuthService } from './auth.service';

describe('adminGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['isLoggedIn', 'isPlatformAdmin', 'getHomeRoute']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router }
      ]
    });
  });

  it('redirects guests to login', () => {
    authService.isLoggedIn.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));

    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('allows platform admins', () => {
    authService.isLoggedIn.and.returnValue(true);
    authService.isPlatformAdmin.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));

    expect(result).toBeTrue();
  });

  it('redirects non-admin users to their home route', () => {
    authService.isLoggedIn.and.returnValue(true);
    authService.isPlatformAdmin.and.returnValue(false);
    authService.getHomeRoute.and.returnValue('/dashboard');

    const result = TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));

    expect(result).toBeFalse();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });
});
