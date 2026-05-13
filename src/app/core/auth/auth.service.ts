import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, OtpChallengeResponse, RegisterRequest, User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'flowboard_token';
  private readonly USER_KEY  = 'flowboard_user';
  private readonly AVATAR_REVISION_KEY = 'flowboard_avatar_revision';
  private readonly BASE = environment.services.auth;
  private readonly AUTH_BASE = environment.oauthBaseUrl
    ? `${environment.oauthBaseUrl}/api/v1`
    : this.BASE;

  private readonly currentUserSubject = new BehaviorSubject<User | null>(this.loadUser());
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private readonly http: HttpClient, private readonly router: Router) {}

  register(req: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.AUTH_BASE}/auth/register`, req)
      .pipe(tap(res => this.setSession(res)));
  }

  requestRegistrationOtp(req: RegisterRequest): Observable<OtpChallengeResponse> {
    return this.http.post<OtpChallengeResponse>(`${this.AUTH_BASE}/auth/register/request-otp`, req);
  }

  verifyRegistrationOtp(email: string, otp: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.AUTH_BASE}/auth/register/verify-otp`, { email, otp })
      .pipe(tap(res => this.setSession(res)));
  }

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.AUTH_BASE}/auth/login`, req)
      .pipe(tap(res => this.setSession(res)));
  }

  requestLoginOtp(req: LoginRequest): Observable<OtpChallengeResponse> {
    return this.http.post<OtpChallengeResponse>(`${this.AUTH_BASE}/auth/login/request-otp`, req);
  }

  verifyLoginOtp(email: string, otp: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.AUTH_BASE}/auth/login/verify-otp`, { email, otp })
      .pipe(tap(res => this.setSession(res)));
  }

  resetPassword(email: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.AUTH_BASE}/auth/reset-password`, { email, newPassword });
  }

  requestPasswordResetOtp(email: string): Observable<OtpChallengeResponse> {
    return this.http.post<OtpChallengeResponse>(`${this.AUTH_BASE}/auth/reset-password/request-otp`, { email });
  }

  confirmPasswordReset(email: string, otp: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.AUTH_BASE}/auth/reset-password/confirm`, { email, otp, newPassword });
  }

  logoutRequest(): Observable<void> {
    return this.http.post<void>(`${this.AUTH_BASE}/auth/logout`, {});
  }

  refreshToken(refreshToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.AUTH_BASE}/auth/refresh`, { refreshToken })
      .pipe(tap(res => this.setSession(res)));
  }

  logout(redirect = true): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    if (redirect) {
      this.router.navigate(['/auth/login']);
    }
  }

  handleOAuthCallback(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    this.fetchProfile().subscribe({
      next: (user) => {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.currentUserSubject.next(user);
        this.router.navigateByUrl(this.getHomeRoute(user));
      },
      error: () => {
        this.logout(false);
        this.router.navigate(['/auth/login'], {
          queryParams: { oauthError: 'OAuth sign-in failed. Please try again.' }
        });
      }
    });
  }

  fetchProfile(): Observable<User> {
    return this.http.get<User>(`${this.AUTH_BASE}/auth/profile`).pipe(
      tap(user => {
        this.storeUser(user);
      })
    );
  }

  ensureCurrentUserLoaded(): void {
    if (!this.getToken() || this.getCurrentUser()) {
      return;
    }

    this.fetchProfile().subscribe({
      error: () => this.logout(false)
    });
  }

  getToken(): string | null { return localStorage.getItem(this.TOKEN_KEY); }

  isLoggedIn(): boolean { return !!this.getToken(); }

  getCurrentUser(): User | null { return this.currentUserSubject.value; }

  isSuspended(user: User | null = this.getCurrentUser()): boolean {
    return user?.isActive === false;
  }

  isPlatformAdmin(user: User | null = this.getCurrentUser()): boolean {
    return user?.role === 'PLATFORM_ADMIN';
  }

  getHomeRoute(user: User | null = this.getCurrentUser()): string {
    if (this.isSuspended(user)) {
      return '/account-suspended';
    }
    return '/dashboard';
  }

  markSuspended(): void {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      this.storeUser({ ...currentUser, isActive: false });
    }
  }

  isSuspendedError(err: any): boolean {
    const headerStatus = err?.headers?.get?.('X-Account-Status');
    const message = typeof err?.error === 'string'
      ? err.error
      : err?.error?.message || err?.message || '';
    return headerStatus === 'SUSPENDED' || /suspend/i.test(message);
  }

  searchUsers(q: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.AUTH_BASE}/auth/search?q=${q}`);
  }

  getUserById(userId: number): Observable<User> {
    return this.http.get<User>(`${this.AUTH_BASE}/auth/users/${userId}`);
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.AUTH_BASE}/auth/users`);
  }

  updateProfile(req: Partial<Pick<User, 'fullName' | 'username' | 'bio' | 'avatarUrl'>>): Observable<User> {
    return this.http.put<User>(`${this.AUTH_BASE}/auth/profile`, req).pipe(
      tap(user => {
        this.bumpAvatarRevision();
        this.storeUser(user);
      })
    );
  }

  changePassword(oldPassword: string, newPassword: string): Observable<void> {
    return this.http.put<void>(`${this.AUTH_BASE}/auth/password`, { oldPassword, newPassword });
  }

  deactivateUser(userId: number): Observable<void> {
    return this.http.patch<void>(`${this.AUTH_BASE}/auth/users/${userId}/deactivate`, {});
  }

  reactivateUser(userId: number): Observable<void> {
    return this.http.patch<void>(`${this.AUTH_BASE}/auth/users/${userId}/reactivate`, {});
  }

  deleteUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.AUTH_BASE}/auth/users/${userId}`);
  }

  getAvatarRevision(): string {
    return localStorage.getItem(this.AVATAR_REVISION_KEY) || '0';
  }

  private setSession(auth: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, auth.accessToken);
    this.storeUser(auth.user);
  }

  private storeUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private loadUser(): User | null {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  private bumpAvatarRevision(): void {
    localStorage.setItem(this.AVATAR_REVISION_KEY, Date.now().toString());
  }
}
