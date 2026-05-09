import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatButtonModule, MatSnackBarModule, MatProgressSpinnerModule, MatIconModule],
  template: `
    <div class="login-shell min-h-screen overflow-hidden">
      <div class="login-glow login-glow-left"></div>
      <div class="login-glow login-glow-right"></div>

      <div class="login-layout relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div class="grid w-full gap-6 lg:grid-cols-[1.12fr,0.88fr]">
          <section class="brand-panel rounded-[32px] px-6 py-8 text-white shadow-[0_35px_90px_rgba(8,47,73,0.28)] sm:px-8 sm:py-10">
            <div class="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-sky-100">
              <span class="brand-orb"></span>
              FlowBoard
            </div>
            <h1 class="mt-6 max-w-xl text-4xl font-semibold leading-tight sm:text-5xl">
              Workspaces that feel calm when the week gets chaotic.
            </h1>
            <p class="mt-5 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
              Sign in with a one-time email code, or keep using Google if that is how your team already works.
            </p>
          </section>

          <section class="auth-card rounded-[32px] p-6 text-slate-900 shadow-[0_35px_90px_rgba(15,23,42,0.16)] sm:p-8">
            <div class="auth-card-accent"></div>

            <div class="auth-switcher">
              <a routerLink="/auth/login" class="auth-switch is-active">Sign In</a>
              <a routerLink="/auth/register" class="auth-switch">Register</a>
            </div>

            <p class="text-sm font-semibold uppercase tracking-[0.26em] text-sky-700/80">Welcome back</p>
            <h2 class="mt-4 text-3xl font-semibold text-slate-950">Sign in with your email code</h2>
            <p class="mt-3 text-sm leading-6 text-slate-600">
              We will send a 6-digit code to your inbox. Enter it here to continue into FlowBoard.
            </p>

            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="mt-8 space-y-4">
              <div *ngIf="!otpSent" class="space-y-4">
                <mat-form-field appearance="fill" class="login-form-field w-full">
                  <mat-label>Email</mat-label>
                  <input matInput type="email" formControlName="email" placeholder="you@example.com">
                  <mat-icon matPrefix>mail</mat-icon>
                  <mat-error *ngIf="form.get('email')?.hasError('required')">Email is required</mat-error>
                  <mat-error *ngIf="form.get('email')?.hasError('email')">Enter a valid email address</mat-error>
                </mat-form-field>

                <mat-form-field appearance="fill" class="login-form-field w-full">
                  <mat-label>Password</mat-label>
                  <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="password" placeholder="Enter your password">
                  <mat-icon matPrefix>lock</mat-icon>
                  <button mat-icon-button matSuffix type="button" (click)="hidePassword = !hidePassword">
                    <mat-icon>{{ hidePassword ? 'visibility' : 'visibility_off' }}</mat-icon>
                  </button>
                  <mat-error *ngIf="form.get('password')?.hasError('required')">Password is required</mat-error>
                </mat-form-field>
              </div>

              <div *ngIf="otpSent" class="otp-panel">
                <p class="otp-title">Your sign-in code is on its way</p>
                <p class="otp-copy">
                  Enter the 6-digit code sent to <strong>{{ submittedEmail }}</strong>.
                </p>

                <mat-form-field appearance="fill" class="login-form-field w-full">
                  <mat-label>Verification Code</mat-label>
                  <input matInput formControlName="otp" inputmode="numeric" maxlength="6" placeholder="123456" (input)="sanitizeOtp()">
                  <mat-icon matPrefix>password</mat-icon>
                  <mat-error *ngIf="form.get('otp')?.hasError('required')">Verification code is required</mat-error>
                  <mat-error *ngIf="form.get('otp')?.hasError('pattern')">Enter the 6-digit code from your email</mat-error>
                </mat-form-field>
              </div>

              <button mat-flat-button color="primary" type="submit" class="login-submit-button w-full" [disabled]="loading || form.invalid">
                <mat-spinner diameter="20" *ngIf="loading" class="login-spinner"></mat-spinner>
                {{ loading ? (otpSent ? 'Verifying your code...' : 'Signing in...') : (otpSent ? 'Verify And Sign In' : 'Sign In') }}
              </button>
            </form>

            <div *ngIf="otpSent" class="mt-4 flex items-center justify-between gap-3 text-sm text-slate-600">
              <span>Need another code?</span>
              <button mat-button type="button" class="support-link-button" [disabled]="loading" (click)="resendOtp()">Resend code</button>
            </div>

            <div class="mt-4 text-right">
              <a routerLink="/auth/reset-password" class="support-link">Forgot your password?</a>
            </div>

            <div class="divider-row my-7">
              <span>or continue with</span>
            </div>

            <a [href]="googleOAuthUrl" mat-stroked-button class="google-button w-full">
              <mat-icon>login</mat-icon>
              Continue with Google
            </a>
          </section>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-shell { position: relative; min-height: 100dvh; overflow: hidden; background: radial-gradient(circle at top left, rgba(56, 189, 248, 0.22), transparent 24rem), radial-gradient(circle at 90% 18%, rgba(14, 165, 233, 0.18), transparent 20rem), linear-gradient(135deg, #020617 0%, #082f49 35%, #0f172a 100%); }
    .login-layout { min-height: 100dvh; }
    .login-glow { position: absolute; width: 18rem; height: 18rem; border-radius: 9999px; filter: blur(58px); opacity: 0.35; pointer-events: none; }
    .login-glow-left { top: 4rem; left: -3rem; background: rgba(14, 165, 233, 0.46); }
    .login-glow-right { right: -4rem; bottom: 4rem; background: rgba(34, 197, 94, 0.22); }
    .brand-panel, .auth-card { position: relative; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(18px); }
    .brand-panel { background: radial-gradient(circle at top right, rgba(125, 211, 252, 0.16), transparent 18rem), linear-gradient(180deg, rgba(15, 23, 42, 0.55), rgba(15, 23, 42, 0.22)); }
    .auth-card { background: rgba(255, 255, 255, 0.92); border-color: rgba(226, 232, 240, 0.7); }
    .auth-card-accent { position: absolute; inset: 0 0 auto; height: 0.35rem; background: linear-gradient(90deg, #0284c7, #22c55e); }
    .brand-orb { display: inline-block; width: 0.7rem; height: 0.7rem; border-radius: 9999px; background: #7dd3fc; box-shadow: 0 0 18px rgba(125, 211, 252, 0.95); }
    .auth-switcher { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.35rem; margin-bottom: 1.5rem; padding: 0.35rem; border-radius: 9999px; background: linear-gradient(180deg, rgba(226, 232, 240, 0.65), rgba(241, 245, 249, 0.95)); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85); }
    .auth-switch { display: inline-flex; align-items: center; justify-content: center; min-height: 2.85rem; border-radius: 9999px; color: #475569; font-size: 0.95rem; font-weight: 700; text-decoration: none; }
    .auth-switch.is-active { color: white; background: linear-gradient(135deg, #0369a1, #0f172a); box-shadow: 0 14px 28px rgba(15, 23, 42, 0.18); }
    .divider-row { display: flex; align-items: center; gap: 1rem; color: #94a3b8; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.18em; }
    .divider-row::before, .divider-row::after { content: ''; flex: 1 1 auto; height: 1px; background: linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.5), transparent); }
    .login-submit-button, .google-button { border-radius: 9999px; min-height: 3.5rem; font-weight: 600; }
    .support-link, .support-link-button { color: #0369a1; text-decoration: none; font-size: 0.92rem; font-weight: 600; }
    .login-submit-button { box-shadow: 0 18px 38px rgba(2, 132, 199, 0.22); }
    .google-button { border-color: rgba(148, 163, 184, 0.32) !important; color: #0f172a !important; background: rgba(255, 255, 255, 0.7) !important; }
    .login-spinner { display: inline-block; margin-right: 0.65rem; }
    .otp-toggle-link { color: #0369a1; font-weight: 600; font-size: 0.9rem; }
    .otp-toggle-link mat-icon { margin-right: 0.5rem; font-size: 1.2rem; width: 1.2rem; height: 1.2rem; }
    .otp-panel { border-radius: 1.25rem; border: 1px solid rgba(14, 165, 233, 0.18); background: rgba(240, 249, 255, 0.72); padding: 1rem; }
    .otp-title { margin: 0; font-size: 0.95rem; font-weight: 700; color: #0f172a; }
    .otp-copy { margin: 0.4rem 0 1rem; font-size: 0.9rem; line-height: 1.6; color: #475569; }
    :host ::ng-deep .login-form-field { --mdc-filled-text-field-container-color: transparent; --mdc-filled-text-field-focus-active-indicator-color: transparent; --mdc-filled-text-field-active-indicator-color: transparent; --mat-form-field-state-layer-color: transparent; }
    :host ::ng-deep .login-form-field .mat-mdc-text-field-wrapper { border-radius: 1.2rem; background: rgba(248, 250, 252, 0.82); transition: box-shadow 180ms ease, background-color 180ms ease; padding-left: 0.15rem; padding-right: 0.15rem; }
    :host ::ng-deep .login-form-field .mat-mdc-form-field-infix { min-height: 3.5rem; padding-top: 1.2rem; padding-bottom: 0.65rem; }
    :host ::ng-deep .login-form-field .mdc-line-ripple { display: none; }
    :host ::ng-deep .login-form-field .mat-mdc-form-field-focus-overlay { opacity: 0 !important; }
    :host ::ng-deep .login-form-field.mat-focused .mat-mdc-text-field-wrapper { box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.08); background: rgba(240, 249, 255, 0.95); }
  `]
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  otpSent = false;
  hidePassword = true;
  submittedEmail = '';
  googleOAuthUrl = `${environment.oauthBaseUrl}/oauth2/authorization/google`;

  constructor(private readonly fb: FormBuilder, private readonly auth: AuthService,
              private readonly router: Router, private readonly route: ActivatedRoute, private readonly snack: MatSnackBar) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      otp: [''],
    });

    this.route.queryParams.subscribe(params => {
      const oauthError = params['oauthError'];
      if (oauthError) {
        this.snack.open(oauthError, 'Close', { duration: 5000 });
      }
    });
  }

  onSubmit(): void {
    if (this.loading || this.form.invalid) return;

    if (this.otpSent) {
      this.verifyOtp();
      return;
    }

    this.requestOtp();
  }

  public loginWithPassword(): void {
    this.loading = true;
    const { email, password } = this.form.value;

    this.auth.login({ email: email.trim(), password }).subscribe({
      next: () => this.router.navigateByUrl(this.auth.getHomeRoute()),
      error: (err) => {
        this.snack.open(err.error?.message || 'Login failed. Please check your credentials.', 'Close', { duration: 4000 });
        this.loading = false;
      }
    });
  }

  resendOtp(): void {
    if (this.loading) return;
    this.requestOtp();
  }

  sanitizeOtp(): void {
    const control = this.form.get('otp');
    const value = String(control?.value || '');
    const cleaned = value.replaceAll(/\D/g, '');
    if (value !== cleaned) {
      control?.setValue(cleaned, { emitEvent: false });
    }
  }

  public requestOtp(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const { email, password } = this.form.value;

    this.auth.requestLoginOtp({ email: email.trim(), password }).subscribe({
      next: (response) => {
        this.otpSent = true;
        this.submittedEmail = email.trim();
        this.form.get('otp')?.setValidators([Validators.required, Validators.pattern(/^\d{6}$/)]);
        this.form.get('otp')?.updateValueAndValidity();
        this.snack.open(response.message || 'Verification code sent to your email.', 'Close', { duration: 4000 });
        this.loading = false;
      },
      error: (err) => {
        this.snack.open(err.error?.message || 'Login failed. Please check your credentials.', 'Close', { duration: 4000 });
        this.loading = false;
      }
    });
  }

  private verifyOtp(): void {
    this.form.get('otp')?.markAsTouched();
    if (this.form.get('otp')?.invalid) return;

    this.loading = true;
    this.auth.verifyLoginOtp(
      this.form.value.email.trim(),
      this.form.value.otp.trim()
    ).subscribe({
      next: () => this.router.navigateByUrl(this.auth.getHomeRoute()),
      error: (err) => {
        this.snack.open(err.error?.message || 'Login failed', 'Close', { duration: 4000 });
        this.loading = false;
      }
    });
  }
}
