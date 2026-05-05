import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { AuthResponse, User } from '../models/user.model';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: jasmine.SpyObj<Router>;

  const user: User = {
    id: 1,
    fullName: 'Prashant Kumar',
    email: 'prashant@example.com',
    username: 'prashant',
    role: 'MEMBER',
    provider: 'LOCAL',
    isActive: true,
    createdAt: '2026-05-04T00:00:00Z'
  };

  const authResponse: AuthResponse = {
    accessToken: 'token-123',
    tokenType: 'Bearer',
    user
  };

  beforeEach(() => {
    localStorage.clear();
    router = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
        { provide: Router, useValue: router }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('stores the session after login', () => {
    service.login({ email: 'prashant@example.com', password: 'secret' }).subscribe((response) => {
      expect(response).toEqual(authResponse);
    });

    const request = httpMock.expectOne('http://localhost:8081/api/v1/auth/login');
    expect(request.request.method).toBe('POST');
    request.flush(authResponse);

    expect(localStorage.getItem('flowboard_token')).toBe('token-123');
    expect(service.getCurrentUser()).toEqual(user);
    expect(service.isLoggedIn()).toBeTrue();
  });

  it('stores the session after registration', () => {
    service.register({
      fullName: 'Prashant Kumar',
      email: 'prashant@example.com',
      username: 'prashant',
      password: 'secret'
    }).subscribe((response) => {
      expect(response).toEqual(authResponse);
    });

    const request = httpMock.expectOne('http://localhost:8081/api/v1/auth/register');
    expect(request.request.method).toBe('POST');
    request.flush(authResponse);

    expect(localStorage.getItem('flowboard_token')).toBe('token-123');
    expect(service.getCurrentUser()).toEqual(user);
  });

  it('requests and verifies registration OTP', () => {
    service.requestRegistrationOtp({
      fullName: 'Prashant Kumar',
      email: 'prashant@example.com',
      username: 'prashant',
      password: 'secret'
    }).subscribe((response) => {
      expect(response).toEqual({ message: 'OTP sent', expiresInSeconds: 300 });
    });

    const otpRequest = httpMock.expectOne('http://localhost:8081/api/v1/auth/register/request-otp');
    expect(otpRequest.request.method).toBe('POST');
    otpRequest.flush({ message: 'OTP sent', expiresInSeconds: 300 });

    service.verifyRegistrationOtp('prashant@example.com', '123456').subscribe((response) => {
      expect(response).toEqual(authResponse);
    });

    const verifyRequest = httpMock.expectOne('http://localhost:8081/api/v1/auth/register/verify-otp');
    expect(verifyRequest.request.method).toBe('POST');
    expect(verifyRequest.request.body).toEqual({ email: 'prashant@example.com', otp: '123456' });
    verifyRequest.flush(authResponse);

    expect(service.getCurrentUser()).toEqual(user);
  });

  it('requests and verifies login OTP', () => {
    service.requestLoginOtp('prashant@example.com').subscribe((response) => {
      expect(response).toEqual({ message: 'OTP sent', expiresInSeconds: 300 });
    });

    const otpRequest = httpMock.expectOne('http://localhost:8081/api/v1/auth/login/request-otp');
    expect(otpRequest.request.method).toBe('POST');
    expect(otpRequest.request.body).toEqual({ email: 'prashant@example.com' });
    otpRequest.flush({ message: 'OTP sent', expiresInSeconds: 300 });

    service.verifyLoginOtp('prashant@example.com', '654321').subscribe((response) => {
      expect(response).toEqual(authResponse);
    });

    const verifyRequest = httpMock.expectOne('http://localhost:8081/api/v1/auth/login/verify-otp');
    expect(verifyRequest.request.method).toBe('POST');
    expect(verifyRequest.request.body).toEqual({ email: 'prashant@example.com', otp: '654321' });
    verifyRequest.flush(authResponse);

    expect(service.getCurrentUser()).toEqual(user);
  });

  it('handles password reset flows', () => {
    service.resetPassword('prashant@example.com', 'new-secret').subscribe();
    const resetRequest = httpMock.expectOne('http://localhost:8081/api/v1/auth/reset-password');
    expect(resetRequest.request.method).toBe('POST');
    expect(resetRequest.request.body).toEqual({ email: 'prashant@example.com', newPassword: 'new-secret' });
    resetRequest.flush({});

    service.requestPasswordResetOtp('prashant@example.com').subscribe((response) => {
      expect(response).toEqual({ message: 'OTP sent', expiresInSeconds: 300 });
    });
    const requestOtp = httpMock.expectOne('http://localhost:8081/api/v1/auth/reset-password/request-otp');
    expect(requestOtp.request.method).toBe('POST');
    expect(requestOtp.request.body).toEqual({ email: 'prashant@example.com' });
    requestOtp.flush({ message: 'OTP sent', expiresInSeconds: 300 });

    service.confirmPasswordReset('prashant@example.com', '111222', 'fresh-secret').subscribe();
    const confirmRequest = httpMock.expectOne('http://localhost:8081/api/v1/auth/reset-password/confirm');
    expect(confirmRequest.request.method).toBe('POST');
    expect(confirmRequest.request.body).toEqual({
      email: 'prashant@example.com',
      otp: '111222',
      newPassword: 'fresh-secret'
    });
    confirmRequest.flush({});
  });

  it('redirects to the user home route after a successful OAuth callback', () => {
    service.handleOAuthCallback('oauth-token');

    const request = httpMock.expectOne('http://localhost:8081/api/v1/auth/profile');
    expect(request.request.method).toBe('GET');
    request.flush(user);

    expect(localStorage.getItem('flowboard_token')).toBe('oauth-token');
    expect(localStorage.getItem('flowboard_user')).toBe(JSON.stringify(user));
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('clears session and redirects to login when OAuth callback profile fetch fails', () => {
    service.handleOAuthCallback('oauth-token');

    const request = httpMock.expectOne('http://localhost:8081/api/v1/auth/profile');
    request.flush({ message: 'nope' }, { status: 500, statusText: 'Server Error' });

    expect(localStorage.getItem('flowboard_token')).toBeNull();
    expect(localStorage.getItem('flowboard_user')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], {
      queryParams: { oauthError: 'OAuth sign-in failed. Please try again.' }
    });
  });

  it('loads the current user once when a token exists without a cached profile', () => {
    localStorage.setItem('flowboard_token', 'token-123');

    service = TestBed.inject(AuthService);
    service.ensureCurrentUserLoaded();

    const request = httpMock.expectOne('http://localhost:8081/api/v1/auth/profile');
    request.flush(user);

    expect(service.getCurrentUser()).toEqual(user);
  });

  it('logs out without redirect when profile loading fails during bootstrap', () => {
    localStorage.setItem('flowboard_token', 'token-123');

    service = TestBed.inject(AuthService);
    service.ensureCurrentUserLoaded();

    const request = httpMock.expectOne('http://localhost:8081/api/v1/auth/profile');
    request.flush({ message: 'nope' }, { status: 500, statusText: 'Server Error' });

    expect(localStorage.getItem('flowboard_token')).toBeNull();
    expect(localStorage.getItem('flowboard_user')).toBeNull();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('does not fetch the current user when no token or cached user already exists', () => {
    service.ensureCurrentUserLoaded();
    httpMock.expectNone('http://localhost:8081/api/v1/auth/profile');

    localStorage.setItem('flowboard_token', 'token-123');
    (service as any).currentUserSubject.next(user);

    service.ensureCurrentUserLoaded();
    httpMock.expectNone('http://localhost:8081/api/v1/auth/profile');
    expect(service.getCurrentUser()).toEqual(user);
  });

  it('marks the current user as suspended', () => {
    (service as any).currentUserSubject.next(user);

    service.markSuspended();

    expect(service.getCurrentUser()?.isActive).toBeFalse();
  });

  it('does nothing when markSuspended is called without a current user', () => {
    service.markSuspended();

    expect(service.getCurrentUser()).toBeNull();
  });

  it('detects suspended errors from either header or message', () => {
    expect(service.isSuspendedError({
      headers: { get: () => 'SUSPENDED' }
    })).toBeTrue();

    expect(service.isSuspendedError({
      error: { message: 'Your account has been suspended.' }
    })).toBeTrue();

    expect(service.isSuspendedError({
      error: { message: 'Another error' }
    })).toBeFalse();
  });

  it('detects suspended errors from string and top-level messages', () => {
    expect(service.isSuspendedError({
      error: 'Account suspended by admin'
    })).toBeTrue();

    expect(service.isSuspendedError({
      message: 'Suspended for review'
    })).toBeTrue();
  });

  it('returns the suspended home route for inactive users', () => {
    expect(service.getHomeRoute({ ...user, isActive: false })).toBe('/account-suspended');
    expect(service.getHomeRoute(user)).toBe('/dashboard');
  });

  it('returns auth state helpers from the current user', () => {
    expect(service.getToken()).toBeNull();
    expect(service.isLoggedIn()).toBeFalse();
    expect(service.isSuspended()).toBeFalse();
    expect(service.isPlatformAdmin()).toBeFalse();

    localStorage.setItem('flowboard_token', 'token-123');
    (service as any).currentUserSubject.next({ ...user, role: 'PLATFORM_ADMIN', isActive: false });

    expect(service.getToken()).toBe('token-123');
    expect(service.isLoggedIn()).toBeTrue();
    expect(service.isSuspended()).toBeTrue();
    expect(service.isPlatformAdmin()).toBeTrue();
  });

  it('updates the stored user after profile updates', () => {
    service.updateProfile({ fullName: 'Updated Name' }).subscribe((response) => {
      expect(response.fullName).toBe('Updated Name');
    });

    const request = httpMock.expectOne('http://localhost:8081/api/v1/auth/profile');
    expect(request.request.method).toBe('PUT');
    request.flush({ ...user, fullName: 'Updated Name' });

    expect(service.getCurrentUser()?.fullName).toBe('Updated Name');
  });

  it('fetches the current profile and stores it', () => {
    service.fetchProfile().subscribe((response) => {
      expect(response).toEqual(user);
    });

    const request = httpMock.expectOne('http://localhost:8081/api/v1/auth/profile');
    expect(request.request.method).toBe('GET');
    request.flush(user);

    expect(service.getCurrentUser()).toEqual(user);
  });

  it('searches users and gets a user by id', () => {
    service.searchUsers('pra').subscribe((response) => {
      expect(response).toEqual([user]);
    });

    const searchRequest = httpMock.expectOne('http://localhost:8081/api/v1/auth/search?q=pra');
    expect(searchRequest.request.method).toBe('GET');
    searchRequest.flush([user]);

    service.getUserById(1).subscribe((response) => {
      expect(response).toEqual(user);
    });

    const userRequest = httpMock.expectOne('http://localhost:8081/api/v1/auth/users/1');
    expect(userRequest.request.method).toBe('GET');
    userRequest.flush(user);
  });

  it('clears the session and redirects on logout by default', () => {
    localStorage.setItem('flowboard_token', 'token-123');
    localStorage.setItem('flowboard_user', JSON.stringify(user));
    (service as any).currentUserSubject.next(user);

    service.logout();

    expect(localStorage.getItem('flowboard_token')).toBeNull();
    expect(localStorage.getItem('flowboard_user')).toBeNull();
    expect(service.getCurrentUser()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });
});
