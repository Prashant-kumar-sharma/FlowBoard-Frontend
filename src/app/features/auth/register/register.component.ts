import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatSnackBarModule, MatProgressSpinnerModule, MatProgressBarModule, MatIconModule],
  template: `
    <div class="auth-shell min-h-screen overflow-hidden">
      <div class="auth-glow auth-glow-left"></div>
      <div class="auth-glow auth-glow-right"></div>

      <div class="auth-layout relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div class="grid w-full gap-6 lg:grid-cols-[1.12fr,0.88fr]">
          <section class="brand-panel rounded-[32px] px-6 py-8 text-white shadow-[0_35px_90px_rgba(8,47,73,0.28)] sm:px-8 sm:py-10">
            <div class="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-sky-100">
              <span class="brand-orb"></span>
              FlowBoard
            </div>

            <h1 class="mt-6 max-w-xl text-4xl font-semibold leading-tight sm:text-5xl">
              Set up a workspace home your team will actually want to open.
            </h1>
            <p class="mt-5 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
              Create your account to organize boards, invite collaborators, and give projects a cleaner place to move from idea to delivery.
            </p>

            <div class="mt-10 grid gap-4 sm:grid-cols-3">
              <article *ngFor="let stat of stats" class="brand-stat">
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100/70">{{ stat.label }}</p>
                <p class="mt-3 text-3xl font-semibold text-white">{{ stat.value }}</p>
                <p class="mt-2 text-sm leading-6 text-slate-200/80">{{ stat.copy }}</p>
              </article>
            </div>
          </section>

          <section class="auth-card rounded-[32px] p-6 text-slate-900 shadow-[0_35px_90px_rgba(15,23,42,0.16)] sm:p-8">
            <div class="auth-card-accent"></div>

            <div class="auth-switcher">
              <a routerLink="/auth/login" class="auth-switch">Sign In</a>
              <a routerLink="/auth/register" class="auth-switch is-active">Register</a>
            </div>

            <p class="text-sm font-semibold uppercase tracking-[0.26em] text-sky-700/80">Create your account</p>
            <h2 class="mt-4 text-3xl font-semibold text-slate-950">Verify your email before we open the door</h2>
            <p class="mt-3 text-sm leading-6 text-slate-600">
              Enter your account details, then confirm the 6-digit code we send to your inbox before your workspace account is created.
            </p>

            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="mt-8 space-y-4">
              <mat-form-field appearance="fill" class="auth-form-field w-full">
                <mat-label>Full Name</mat-label>
                <input matInput formControlName="fullName" placeholder="Aisha Patel" (input)="sanitizeFullName()">
                <mat-icon matPrefix>badge</mat-icon>
                <mat-error *ngIf="form.get('fullName')?.hasError('required')">Full name is required</mat-error>
                <mat-error *ngIf="form.get('fullName')?.hasError('pattern')">Full name can contain alphabets and spaces only</mat-error>
              </mat-form-field>

              <mat-form-field appearance="fill" class="auth-form-field w-full">
                <mat-label>Email</mat-label>
                <input matInput type="email" formControlName="email" placeholder="you@example.com">
                <mat-icon matPrefix>mail</mat-icon>
                <mat-error *ngIf="form.get('email')?.hasError('required')">Email is required</mat-error>
                <mat-error *ngIf="emailMessage && !form.get('email')?.hasError('required')">{{ emailMessage }}</mat-error>
              </mat-form-field>

              <mat-form-field appearance="fill" class="auth-form-field w-full">
                <mat-label>Username</mat-label>
                <input matInput formControlName="username" placeholder="aisha.p_01" (input)="sanitizeUsername()">
                <mat-icon matPrefix>alternate_email</mat-icon>
                <mat-error *ngIf="form.get('username')?.hasError('required')">Username is required</mat-error>
                <mat-error *ngIf="form.get('username')?.hasError('minlength')">Use at least 3 characters</mat-error>
                <mat-error *ngIf="form.get('username')?.hasError('maxlength')">Use no more than 30 characters</mat-error>
                <mat-error *ngIf="form.get('username')?.hasError('pattern')">Use only letters, numbers, underscores, and full stops</mat-error>
              </mat-form-field>

              <mat-form-field appearance="fill" class="auth-form-field w-full">
                <mat-label>Password</mat-label>
                <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="password" placeholder="Choose a secure password">
                <mat-icon matPrefix>lock</mat-icon>
                <button mat-icon-button matSuffix type="button" (click)="hidePassword = !hidePassword">
                  <mat-icon>{{ hidePassword ? 'visibility' : 'visibility_off' }}</mat-icon>
                </button>
                <mat-error *ngIf="form.get('password')?.hasError('required')">Password is required</mat-error>
                <mat-error *ngIf="passwordMessage && !form.get('password')?.hasError('required')">{{ passwordMessage }}</mat-error>
              </mat-form-field>

              <div *ngIf="showPasswordStrength" class="password-strength">
                <div class="password-strength-copy">
                  <span>Password strength</span>
                  <strong [class]="passwordStrengthClass">{{ passwordStrengthLabel }}</strong>
                </div>
                <mat-progress-bar mode="determinate" [value]="passwordStrengthPercent" [class]="passwordStrengthClass"></mat-progress-bar>
              </div>

              <div *ngIf="otpSent" class="otp-panel">
                <p class="otp-title">Email verification code sent</p>
                <p class="otp-copy">
                  We sent a 6-digit code to <strong>{{ submittedEmail }}</strong>. Enter it below to finish creating your account.
                </p>

                <mat-form-field appearance="fill" class="auth-form-field w-full">
                  <mat-label>Verification Code</mat-label>
                  <input matInput formControlName="otp" inputmode="numeric" maxlength="6" placeholder="123456" (input)="sanitizeOtp()">
                  <mat-icon matPrefix>verified_user</mat-icon>
                  <mat-error *ngIf="form.get('otp')?.hasError('required')">Verification code is required</mat-error>
                  <mat-error *ngIf="form.get('otp')?.hasError('pattern')">Enter the 6-digit code from your email</mat-error>
                </mat-form-field>
              </div>

              <button mat-flat-button color="primary" type="submit" class="register-submit-button w-full" [disabled]="loading || form.invalid">
                <mat-spinner diameter="20" *ngIf="loading" class="register-spinner"></mat-spinner>
                {{ loading ? (otpSent ? 'Verifying your code...' : 'Sending verification code...') : (otpSent ? 'Verify And Create Account' : 'Send Verification Code') }}
              </button>
            </form>

            <div *ngIf="otpSent" class="mt-4 flex items-center justify-between gap-3 text-sm text-slate-600">
              <span>Did not get it yet?</span>
              <button mat-button type="button" class="support-link-button" [disabled]="loading" (click)="resendOtp()">Resend code</button>
            </div>

            <p class="mt-6 text-center text-sm text-slate-600">
              Need to recover an existing account instead?
              <a routerLink="/auth/reset-password" class="support-link">Reset password</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-shell {
      position: relative;
      min-height: 100dvh;
      overflow: hidden;
      background:
        radial-gradient(circle at top left, rgba(56, 189, 248, 0.22), transparent 24rem),
        radial-gradient(circle at 90% 18%, rgba(14, 165, 233, 0.18), transparent 20rem),
        linear-gradient(135deg, #020617 0%, #082f49 35%, #0f172a 100%);
    }
    .auth-layout { min-height: 100dvh; }
    .auth-glow { position: absolute; width: 18rem; height: 18rem; border-radius: 9999px; filter: blur(58px); opacity: 0.35; pointer-events: none; }
    .auth-glow-left { top: 4rem; left: -3rem; background: rgba(14, 165, 233, 0.46); }
    .auth-glow-right { right: -4rem; bottom: 4rem; background: rgba(34, 197, 94, 0.22); }
    .brand-panel, .auth-card { position: relative; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(18px); }
    .brand-panel { background: radial-gradient(circle at top right, rgba(125, 211, 252, 0.16), transparent 18rem), linear-gradient(180deg, rgba(15, 23, 42, 0.55), rgba(15, 23, 42, 0.22)); }
    .auth-card { background: rgba(255, 255, 255, 0.92); border-color: rgba(226, 232, 240, 0.7); }
    .auth-card-accent { position: absolute; inset: 0 0 auto; height: 0.35rem; background: linear-gradient(90deg, #0284c7, #22c55e); }
    .brand-orb { display: inline-block; width: 0.7rem; height: 0.7rem; border-radius: 9999px; background: #7dd3fc; box-shadow: 0 0 18px rgba(125, 211, 252, 0.95); }
    .brand-stat { border-radius: 1.5rem; border: 1px solid rgba(255, 255, 255, 0.12); background: rgba(255, 255, 255, 0.08); padding: 1.2rem; backdrop-filter: blur(10px); }
    .auth-switcher { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.35rem; margin-bottom: 1.5rem; padding: 0.35rem; border-radius: 9999px; background: linear-gradient(180deg, rgba(226, 232, 240, 0.65), rgba(241, 245, 249, 0.95)); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85); }
    .auth-switch { display: inline-flex; align-items: center; justify-content: center; min-height: 2.85rem; border-radius: 9999px; color: #475569; font-size: 0.95rem; font-weight: 700; text-decoration: none; }
    .auth-switch.is-active { color: white; background: linear-gradient(135deg, #0369a1, #0f172a); box-shadow: 0 14px 28px rgba(15, 23, 42, 0.18); }
    .register-submit-button { min-height: 3.75rem; border-radius: 9999px; font-weight: 700; letter-spacing: 0.01em; box-shadow: 0 20px 42px rgba(2, 132, 199, 0.24); background: linear-gradient(135deg, #0284c7, #0369a1) !important; }
    .register-spinner { display: inline-block; margin-right: 0.65rem; }
    .support-link, .support-link-button { color: #0369a1; text-decoration: none; font-weight: 600; }
    .otp-panel { border-radius: 1.25rem; border: 1px solid rgba(14, 165, 233, 0.18); background: rgba(240, 249, 255, 0.72); padding: 1rem; }
    .otp-title { margin: 0; font-size: 0.95rem; font-weight: 700; color: #0f172a; }
    .otp-copy { margin: 0.4rem 0 1rem; font-size: 0.9rem; line-height: 1.6; color: #475569; }
    .password-strength { margin-top: -0.55rem; padding: 0 0.35rem 0.3rem; }
    .password-strength-copy { display: flex; justify-content: space-between; gap: 1rem; margin-bottom: 0.45rem; font-size: 0.78rem; color: #64748b; }
    .password-strength-copy strong { font-weight: 700; }
    .password-strength-copy .weak { color: #dc2626; }
    .password-strength-copy .fair { color: #d97706; }
    .password-strength-copy .strong { color: #16a34a; }
    :host ::ng-deep .password-strength .mat-mdc-progress-bar { height: 0.42rem; border-radius: 9999px; overflow: hidden; --mdc-linear-progress-track-color: #e2e8f0; }
    :host ::ng-deep .password-strength .mat-mdc-progress-bar.weak { --mdc-linear-progress-active-indicator-color: #ef4444; }
    :host ::ng-deep .password-strength .mat-mdc-progress-bar.fair { --mdc-linear-progress-active-indicator-color: #f59e0b; }
    :host ::ng-deep .password-strength .mat-mdc-progress-bar.strong { --mdc-linear-progress-active-indicator-color: #22c55e; }
    :host ::ng-deep .auth-form-field { --mdc-filled-text-field-container-color: transparent; --mdc-filled-text-field-focus-active-indicator-color: transparent; --mdc-filled-text-field-active-indicator-color: transparent; --mat-form-field-state-layer-color: transparent; }
    :host ::ng-deep .auth-form-field .mat-mdc-text-field-wrapper { border-radius: 1.2rem; background: rgba(248, 250, 252, 0.82); transition: box-shadow 180ms ease, background-color 180ms ease; padding-left: 0.15rem; padding-right: 0.15rem; }
    :host ::ng-deep .auth-form-field .mat-mdc-form-field-infix { min-height: 3.5rem; padding-top: 1.2rem; padding-bottom: 0.65rem; }
    :host ::ng-deep .auth-form-field .mdc-line-ripple { display: none; }
    :host ::ng-deep .auth-form-field .mat-mdc-form-field-focus-overlay { opacity: 0 !important; }
    :host ::ng-deep .auth-form-field.mat-focused .mat-mdc-text-field-wrapper { box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.08); background: rgba(240, 249, 255, 0.95); }
  `]
})
export class RegisterComponent {
  form: FormGroup;
  loading = false;
  hidePassword = true;
  otpSent = false;
  submittedEmail = '';
  readonly stats = [
    { label: 'Setup', value: 'Fast', copy: 'Create an account and get straight into boards and team planning.' },
    { label: 'Spaces', value: 'Shared', copy: 'Bring work, people, and context into one cleaner workspace hub.' },
    { label: 'Security', value: 'Verified', copy: 'Accounts now open only after email ownership has been confirmed.' },
  ];

  constructor(private readonly fb: FormBuilder, private readonly auth: AuthService,
              private readonly router: Router, private readonly snack: MatSnackBar) {
    this.form = this.fb.group({
      fullName: ['', [Validators.required, Validators.pattern(/^[A-Za-z ]+$/)]],
      email: ['', [Validators.required, this.emailValidator.bind(this)]],
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30), Validators.pattern(/^[A-Za-z0-9_.]+$/)]],
      password: ['', [Validators.required, this.passwordValidator]],
      otp: [''],
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.otpSent) {
      this.verifyOtp();
      return;
    }

    this.requestOtp();
  }

  resendOtp(): void {
    if (this.loading) return;
    this.requestOtp();
  }

  sanitizeFullName(): void {
    this.replaceControlValue('fullName', /[^A-Za-z ]/g);
  }

  sanitizeUsername(): void {
    this.replaceControlValue('username', /[^A-Za-z0-9_.]/g);
  }

  sanitizeOtp(): void {
    this.replaceControlValue('otp', /\D/g);
  }

  get emailMessage(): string {
    const email = this.form.get('email');
    if (!email?.touched || !email.errors) return '';
    if (email.hasError('missingAt')) return 'Email must include @';
    if (email.hasError('missingDomain')) return 'Email must include a domain after @';
    if (email.hasError('missingDot')) return 'Email domain must include a full stop';
    if (email.hasError('invalidEmail')) return 'Enter a valid email address, for example name@example.com';
    return '';
  }

  get passwordMessage(): string {
    const password = this.form.get('password');
    if (!password?.touched || !password.errors) return '';
    if (password.hasError('minLengthPassword')) return 'Use at least 8 characters';
    if (password.hasError('missingLowercase')) return 'Add at least one lowercase letter';
    if (password.hasError('missingUppercase')) return 'Add at least one uppercase letter';
    if (password.hasError('missingNumber')) return 'Add at least one number';
    if (password.hasError('missingSpecial')) return 'Add at least one special character';
    return '';
  }

  get showPasswordStrength(): boolean {
    const password = this.form.get('password');
    return !!password?.touched && !!password.value;
  }

  get passwordStrengthPercent(): number {
    return Math.min(100, this.passwordStrengthScore * 20);
  }

  get passwordStrengthLabel(): string {
    if (this.passwordStrengthScore <= 2) return 'Weak';
    if (this.passwordStrengthScore <= 4) return 'Fair';
    return 'Strong';
  }

  get passwordStrengthClass(): string {
    return this.passwordStrengthLabel.toLowerCase();
  }

  private get passwordStrengthScore(): number {
    const value = this.form.get('password')?.value || '';
    return [
      value.length >= 8,
      /[a-z]/.test(value),
      /[A-Z]/.test(value),
      /\d/.test(value),
      /[^A-Za-z0-9]/.test(value),
    ].filter(Boolean).length + (value.length >= 12 ? 1 : 0);
  }

  private requestOtp(): void {
    this.loading = true;
    this.auth.requestRegistrationOtp({
      fullName: this.form.value.fullName.trim(),
      email: this.form.value.email.trim(),
      username: this.form.value.username.trim(),
      password: this.form.value.password,
    }).subscribe({
      next: (response) => {
        this.otpSent = true;
        this.submittedEmail = this.form.value.email.trim();
        this.form.get('otp')?.setValidators([Validators.required, Validators.pattern(/^\d{6}$/)]);
        this.form.get('otp')?.updateValueAndValidity();
        this.snack.open(response.message || 'Verification code sent to your email.', 'Close', { duration: 4000 });
        this.loading = false;
      },
      error: (err) => {
        this.snack.open(err.error?.message || 'Failed to send verification code', 'Close', { duration: 4000 });
        this.loading = false;
      }
    });
  }

  private verifyOtp(): void {
    this.form.get('otp')?.markAsTouched();
    if (this.form.get('otp')?.invalid) return;

    this.loading = true;
    this.auth.verifyRegistrationOtp(
      this.form.value.email.trim(),
      this.form.value.otp.trim()
    ).subscribe({
      next: () => this.router.navigateByUrl(this.auth.getHomeRoute()),
      error: (err) => {
        this.snack.open(err.error?.message || 'Verification failed', 'Close', { duration: 4000 });
        this.loading = false;
      }
    });
  }

  private emailValidator(control: AbstractControl): ValidationErrors | null {
    const value = String(control.value || '').trim();
    if (!value) return null;
    if (!value.includes('@')) return { missingAt: true };
    const [localPart, domain, ...extraParts] = value.split('@');
    if (!localPart || extraParts.length) return { invalidEmail: true };
    if (!domain) return { missingDomain: true };
    if (!domain.includes('.')) return { missingDot: true };
    if (/\s/.test(value)) return { invalidEmail: true };
    if (localPart.startsWith('.') || localPart.endsWith('.')) return { invalidEmail: true };
    if (domain.startsWith('.') || domain.endsWith('.')) return { invalidEmail: true };
    if (localPart.includes('..') || domain.includes('..')) return { invalidEmail: true };

    const domainParts = domain.split('.');
    if (domainParts.some(part => !part)) return { invalidEmail: true };

    const topLevelDomain = domainParts.at(-1) || '';
    if (topLevelDomain.length < 2) return { invalidEmail: true };

    return null;
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

  private replaceControlValue(controlName: string, pattern: RegExp): void {
    const control = this.form.get(controlName);
    const value = String(control?.value || '');
    const cleaned = value.replace(pattern, '');
    if (value !== cleaned) {
      control?.setValue(cleaned, { emitEvent: false });
    }
  }
}
