import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="reset-shell min-h-screen overflow-hidden">
      <div class="reset-glow reset-glow-left"></div>
      <div class="reset-glow reset-glow-right"></div>

      <div class="relative mx-auto flex min-h-screen max-w-5xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <section class="reset-card mx-auto w-full max-w-2xl rounded-[32px] p-6 text-slate-900 shadow-[0_35px_90px_rgba(15,23,42,0.16)] sm:p-8">
          <div class="reset-card-accent"></div>

          <a routerLink="/auth/login" class="back-link">
            <mat-icon>arrow_back</mat-icon>
            Back to sign in
          </a>

          <p class="mt-6 text-sm font-semibold uppercase tracking-[0.26em] text-sky-700/80">Password reset</p>
          <h1 class="mt-4 text-3xl font-semibold text-slate-950">Verify your email before changing your password</h1>
          <p class="mt-3 text-sm leading-6 text-slate-600">
            Enter your FlowBoard email to receive a 6-digit reset code, then choose a new password once that code is verified.
          </p>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="mt-8 space-y-4">
            <mat-form-field appearance="fill" class="reset-form-field w-full">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" placeholder="you@example.com">
              <mat-icon matPrefix>mail</mat-icon>
              <mat-error *ngIf="form.get('email')?.hasError('required')">Email is required</mat-error>
              <mat-error *ngIf="form.get('email')?.hasError('email')">Enter a valid email address</mat-error>
            </mat-form-field>

            <div *ngIf="otpSent" class="otp-panel">
              <p class="otp-title">Reset code sent</p>
              <p class="otp-copy">
                Enter the 6-digit code we sent to <strong>{{ submittedEmail }}</strong>, then set your new password.
              </p>

              <mat-form-field appearance="fill" class="reset-form-field w-full">
                <mat-label>Verification Code</mat-label>
                <input matInput formControlName="otp" inputmode="numeric" maxlength="6" placeholder="123456" (input)="sanitizeOtp()">
                <mat-icon matPrefix>password</mat-icon>
                <mat-error *ngIf="form.get('otp')?.hasError('required')">Verification code is required</mat-error>
                <mat-error *ngIf="form.get('otp')?.hasError('pattern')">Enter the 6-digit code from your email</mat-error>
              </mat-form-field>

              <mat-form-field appearance="fill" class="reset-form-field w-full">
                <mat-label>New Password</mat-label>
                <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="password" placeholder="Choose a new password">
                <mat-icon matPrefix>lock</mat-icon>
                <button mat-icon-button matSuffix type="button" (click)="hidePassword = !hidePassword">
                  <mat-icon>{{ hidePassword ? 'visibility' : 'visibility_off' }}</mat-icon>
                </button>
                <mat-error *ngIf="passwordMessage">{{ passwordMessage }}</mat-error>
              </mat-form-field>

              <mat-form-field appearance="fill" class="reset-form-field w-full">
                <mat-label>Confirm Password</mat-label>
                <input matInput [type]="hideConfirmPassword ? 'password' : 'text'" formControlName="confirmPassword" placeholder="Re-enter your new password">
                <mat-icon matPrefix>verified_user</mat-icon>
                <button mat-icon-button matSuffix type="button" (click)="hideConfirmPassword = !hideConfirmPassword">
                  <mat-icon>{{ hideConfirmPassword ? 'visibility' : 'visibility_off' }}</mat-icon>
                </button>
                <mat-error *ngIf="form.hasError('passwordMismatch') && form.get('confirmPassword')?.touched">Passwords must match</mat-error>
              </mat-form-field>
            </div>

            <button mat-flat-button color="primary" type="submit" class="reset-submit-button w-full" [disabled]="loading || form.get('email')?.invalid">
              <mat-spinner diameter="20" *ngIf="loading" class="reset-spinner"></mat-spinner>
              {{ loading ? (otpSent ? 'Updating your password...' : 'Sending reset code...') : (otpSent ? 'Verify And Reset Password' : 'Send Reset Code') }}
            </button>
          </form>

          <div *ngIf="otpSent" class="mt-4 flex items-center justify-between gap-3 text-sm text-slate-600">
            <span>Need a fresh code?</span>
            <button mat-button type="button" class="support-link-button" [disabled]="loading" (click)="resendOtp()">Resend code</button>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .reset-shell { position: relative; min-height: 100dvh; overflow: hidden; background: radial-gradient(circle at top left, rgba(56, 189, 248, 0.22), transparent 24rem), radial-gradient(circle at 90% 18%, rgba(14, 165, 233, 0.18), transparent 20rem), linear-gradient(135deg, #020617 0%, #082f49 35%, #0f172a 100%); }
    .reset-glow { position: absolute; width: 18rem; height: 18rem; border-radius: 9999px; filter: blur(58px); opacity: 0.35; pointer-events: none; }
    .reset-glow-left { top: 4rem; left: -3rem; background: rgba(14, 165, 233, 0.46); }
    .reset-glow-right { right: -4rem; bottom: 4rem; background: rgba(34, 197, 94, 0.22); }
    .reset-card { position: relative; overflow: hidden; border: 1px solid rgba(226, 232, 240, 0.7); background: rgba(255, 255, 255, 0.92); backdrop-filter: blur(18px); }
    .reset-card-accent { position: absolute; inset: 0 0 auto; height: 0.35rem; background: linear-gradient(90deg, #0284c7, #22c55e); }
    .back-link { display: inline-flex; align-items: center; gap: 0.5rem; color: #0369a1; text-decoration: none; font-weight: 600; }
    .reset-submit-button { min-height: 3.75rem; border-radius: 9999px; font-weight: 700; box-shadow: 0 20px 42px rgba(2, 132, 199, 0.24); background: linear-gradient(135deg, #0284c7, #0369a1) !important; }
    .reset-spinner { display: inline-block; margin-right: 0.65rem; }
    .otp-panel { border-radius: 1.25rem; border: 1px solid rgba(14, 165, 233, 0.18); background: rgba(240, 249, 255, 0.72); padding: 1rem; }
    .otp-title { margin: 0; font-size: 0.95rem; font-weight: 700; color: #0f172a; }
    .otp-copy { margin: 0.4rem 0 1rem; font-size: 0.9rem; line-height: 1.6; color: #475569; }
    .support-link-button { color: #0369a1; font-weight: 600; }
    :host ::ng-deep .reset-form-field { --mdc-filled-text-field-container-color: transparent; --mdc-filled-text-field-focus-active-indicator-color: transparent; --mdc-filled-text-field-active-indicator-color: transparent; --mat-form-field-state-layer-color: transparent; }
    :host ::ng-deep .reset-form-field .mat-mdc-text-field-wrapper { border-radius: 1.2rem; background: rgba(248, 250, 252, 0.82); transition: box-shadow 180ms ease, background-color 180ms ease; padding-left: 0.15rem; padding-right: 0.15rem; }
    :host ::ng-deep .reset-form-field .mat-mdc-form-field-infix { min-height: 3.5rem; padding-top: 1.2rem; padding-bottom: 0.65rem; }
    :host ::ng-deep .reset-form-field .mdc-line-ripple { display: none; }
    :host ::ng-deep .reset-form-field .mat-mdc-form-field-focus-overlay { opacity: 0 !important; }
    :host ::ng-deep .reset-form-field.mat-focused .mat-mdc-text-field-wrapper { box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.08); background: rgba(240, 249, 255, 0.95); }
  `]
})
export class ResetPasswordComponent {
  form: FormGroup;
  loading = false;
  otpSent = false;
  submittedEmail = '';
  hidePassword = true;
  hideConfirmPassword = true;

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly snack: MatSnackBar
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      otp: [''],
      password: [''],
      confirmPassword: [''],
    }, { validators: this.passwordMatchValidator });
  }

  get passwordMessage(): string {
    const password = this.form.get('password');
    if (!password?.touched || !password.errors) return '';
    if (password.hasError('required')) return 'Password is required';
    if (password.hasError('minLengthPassword')) return 'Use at least 8 characters';
    if (password.hasError('missingLowercase')) return 'Add at least one lowercase letter';
    if (password.hasError('missingUppercase')) return 'Add at least one uppercase letter';
    if (password.hasError('missingNumber')) return 'Add at least one number';
    if (password.hasError('missingSpecial')) return 'Add at least one special character';
    return '';
  }

  onSubmit(): void {
    if (this.loading || this.form.get('email')?.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.otpSent) {
      this.confirmReset();
      return;
    }

    this.requestOtp();
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

  private requestOtp(): void {
    this.loading = true;
    const email = this.form.value.email.trim();
    this.auth.requestPasswordResetOtp(email).subscribe({
      next: (response) => {
        this.otpSent = true;
        this.submittedEmail = email;
        this.form.get('otp')?.setValidators([Validators.required, Validators.pattern(/^\d{6}$/)]);
        this.form.get('password')?.setValidators([Validators.required, this.passwordValidator]);
        this.form.get('confirmPassword')?.setValidators([Validators.required]);
        this.form.get('otp')?.updateValueAndValidity();
        this.form.get('password')?.updateValueAndValidity();
        this.form.get('confirmPassword')?.updateValueAndValidity();
        this.snack.open(response.message || 'Password reset code sent to your email.', 'Close', { duration: 4000 });
        this.loading = false;
      },
      error: (err) => {
        this.snack.open(err?.error?.message || 'Failed to send reset code', 'Close', { duration: 4000 });
        this.loading = false;
      }
    });
  }

  private confirmReset(): void {
    this.form.markAllAsTouched();
    if (this.form.get('otp')?.invalid || this.form.get('password')?.invalid || this.form.get('confirmPassword')?.invalid || this.form.hasError('passwordMismatch')) {
      return;
    }

    this.loading = true;
    this.auth.confirmPasswordReset(
      this.form.value.email.trim(),
      this.form.value.otp.trim(),
      this.form.value.password
    ).subscribe({
      next: () => {
        this.snack.open('Password reset successful. You can sign in now.', 'Close', { duration: 4000 });
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        this.snack.open(err?.error?.message || 'Failed to reset password', 'Close', { duration: 4000 });
        this.loading = false;
      }
    });
  }

  private passwordValidator(control: AbstractControl): ValidationErrors | null {
    const value = String(control.value || '');
    if (!value) return null;
    if (value.length < 8) return { minLengthPassword: true };
    if (!/[a-z]/.test(value)) return { missingLowercase: true };
    if (!/[A-Z]/.test(value)) return { missingUppercase: true };
    if (!/\d/.test(value)) return { missingNumber: true };
    if (!/[^A-Za-z0-9]/.test(value)) return { missingSpecial: true };
    return null;
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return password && confirmPassword && password !== confirmPassword ? { passwordMismatch: true } : null;
  }
}
