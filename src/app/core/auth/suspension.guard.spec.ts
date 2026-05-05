import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { suspensionGuard } from './suspension.guard';
import { AuthService } from './auth.service';

describe('suspensionGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['isLoggedIn', 'isSuspended']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router }
      ]
    });
  });

  it('redirects authenticated suspended users', () => {
    authService.isLoggedIn.and.returnValue(true);
    authService.isSuspended.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() => suspensionGuard({} as any, {} as any));

    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/account-suspended']);
  });

  it('allows guests and active users', () => {
    authService.isLoggedIn.and.returnValue(false);

    let result = TestBed.runInInjectionContext(() => suspensionGuard({} as any, {} as any));
    expect(result).toBeTrue();

    authService.isLoggedIn.and.returnValue(true);
    authService.isSuspended.and.returnValue(false);

    result = TestBed.runInInjectionContext(() => suspensionGuard({} as any, {} as any));
    expect(result).toBeTrue();
  });
});
