import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ResetPasswordComponent } from './reset-password.component';
import { AuthService } from '../../../core/auth/auth.service';

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let auth: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let snack: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['requestPasswordResetOtp', 'confirmPasswordReset']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    snack = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    component = new ResetPasswordComponent(new FormBuilder(), auth, router, snack);
  });

  it('sanitizes otp input', () => {
    component.form.get('otp')?.setValue('12a-34');
    component.sanitizeOtp();
    expect(component.form.get('otp')?.value).toBe('1234');
  });

  it('requests reset otp successfully', () => {
    auth.requestPasswordResetOtp.and.returnValue(of({ message: 'Reset sent', expiresInSeconds: 60 }));
    component.form.get('email')?.setValue('user@example.com');

    component.onSubmit();

    expect(auth.requestPasswordResetOtp).toHaveBeenCalledWith('user@example.com');
    expect(component.otpSent).toBeTrue();
    expect(component.submittedEmail).toBe('user@example.com');
    expect(snack.open).toHaveBeenCalledWith('Reset sent', 'Close', { duration: 4000 });
  });

  it('shows reset otp request failure', () => {
    auth.requestPasswordResetOtp.and.returnValue(throwError(() => ({ error: { message: 'No reset' } })));
    component.form.get('email')?.setValue('user@example.com');

    component.onSubmit();

    expect(snack.open).toHaveBeenCalledWith('No reset', 'Close', { duration: 4000 });
    expect(component.loading).toBeFalse();
  });

  it('surfaces password validation messages after otp is sent', () => {
    auth.requestPasswordResetOtp.and.returnValue(of({ message: 'ok', expiresInSeconds: 60 }));
    component.form.get('email')?.setValue('user@example.com');
    component.onSubmit();

    component.form.get('password')?.setValue('');
    component.form.get('password')?.markAsTouched();
    expect(component.passwordMessage).toBe('Password is required');

    component.form.get('password')?.setValue('short');
    expect(component.passwordMessage).toBe('Use at least 8 characters');
  });

  it('covers the remaining password validation branches', () => {
    component.otpSent = true;
    component.form.get('password')?.setValidators([]);
    component.form.get('password')?.markAsTouched();

    component.form.get('password')?.setValidators([(component as any).passwordValidator]);
    component.form.get('password')?.setValue('ALLUPPER1!');
    component.form.get('password')?.updateValueAndValidity();
    expect(component.passwordMessage).toBe('Add at least one lowercase letter');

    component.form.get('password')?.setValue('lowercase1!');
    component.form.get('password')?.updateValueAndValidity();
    expect(component.passwordMessage).toBe('Add at least one uppercase letter');

    component.form.get('password')?.setValue('Lowercase!');
    component.form.get('password')?.updateValueAndValidity();
    expect(component.passwordMessage).toBe('Add at least one number');

    component.form.get('password')?.setValue('Lowercase1');
    component.form.get('password')?.updateValueAndValidity();
    expect(component.passwordMessage).toBe('Add at least one special character');

    component.form.get('password')?.setValue('');
    component.form.get('password')?.setValidators([]);
    component.form.get('password')?.updateValueAndValidity();
    expect(component.passwordMessage).toBe('');
  });

  it('marks the form touched and exits when loading or email is invalid', () => {
    component.loading = true;
    component.onSubmit();
    component.loading = false;

    component.form.get('email')?.setValue('');
    component.onSubmit();

    expect(auth.requestPasswordResetOtp).not.toHaveBeenCalled();
    expect(component.form.touched).toBeTrue();
  });

  it('does not confirm reset when form is invalid or mismatched', () => {
    component.otpSent = true;
    component.form.patchValue({
      email: 'user@example.com',
      otp: '123',
      password: 'Strong@123',
      confirmPassword: 'Mismatch@123'
    });

    component.onSubmit();

    expect(auth.confirmPasswordReset).not.toHaveBeenCalled();
  });

  it('uses fallback messages for request and confirmation failures', () => {
    auth.requestPasswordResetOtp.and.returnValue(throwError(() => ({ error: {} })));
    component.form.get('email')?.setValue('user@example.com');

    component.onSubmit();
    expect(snack.open).toHaveBeenCalledWith('Failed to send reset code', 'Close', { duration: 4000 });

    auth.confirmPasswordReset.and.returnValue(throwError(() => ({ error: {} })));
    component.otpSent = true;
    component.form.get('otp')?.setValidators([]);
    component.form.get('password')?.setValidators([]);
    component.form.get('confirmPassword')?.setValidators([]);
    component.form.patchValue({
      email: 'user@example.com',
      otp: '123456',
      password: 'Strong@123',
      confirmPassword: 'Strong@123'
    });

    component.onSubmit();
    expect(snack.open).toHaveBeenCalledWith('Failed to reset password', 'Close', { duration: 4000 });
    expect(component.loading).toBeFalse();
  });

  it('uses the default success message when otp response message is blank', () => {
    auth.requestPasswordResetOtp.and.returnValue(of({ message: '', expiresInSeconds: 60 }));
    component.form.get('email')?.setValue('user@example.com');

    component.onSubmit();

    expect(snack.open).toHaveBeenCalledWith('Password reset code sent to your email.', 'Close', { duration: 4000 });
  });

  it('does not resend while loading', () => {
    component.loading = true;

    component.resendOtp();

    expect(auth.requestPasswordResetOtp).not.toHaveBeenCalled();
  });

  it('blocks confirmation when otp, password, or confirm password are individually invalid', () => {
    component.otpSent = true;
    component.form.patchValue({
      email: 'user@example.com',
      otp: '123456',
      password: 'Strong@123',
      confirmPassword: 'Strong@123'
    });

    component.form.get('otp')?.setValidators([() => ({ pattern: true })]);
    component.form.get('otp')?.updateValueAndValidity();
    component.onSubmit();
    expect(auth.confirmPasswordReset).not.toHaveBeenCalled();

    component.form.get('otp')?.setValidators([]);
    component.form.get('otp')?.updateValueAndValidity();
    component.form.get('password')?.setValidators([() => ({ missingUppercase: true })]);
    component.form.get('password')?.updateValueAndValidity();
    component.onSubmit();
    expect(auth.confirmPasswordReset).not.toHaveBeenCalled();

    component.form.get('password')?.setValidators([]);
    component.form.get('password')?.updateValueAndValidity();
    component.form.get('confirmPassword')?.setValidators([() => ({ required: true })]);
    component.form.get('confirmPassword')?.updateValueAndValidity();
    component.onSubmit();
    expect(auth.confirmPasswordReset).not.toHaveBeenCalled();
  });

  it('confirms password reset and navigates on success', () => {
    auth.confirmPasswordReset.and.returnValue(of(void 0));
    component.otpSent = true;
    component.form.get('otp')?.setValidators([]);
    component.form.get('password')?.setValidators([]);
    component.form.get('confirmPassword')?.setValidators([]);
    component.form.patchValue({
      email: 'user@example.com',
      otp: '123456',
      password: 'Strong@123',
      confirmPassword: 'Strong@123'
    });

    component.onSubmit();

    expect(auth.confirmPasswordReset).toHaveBeenCalledWith('user@example.com', '123456', 'Strong@123');
    expect(snack.open).toHaveBeenCalledWith('Password reset successful. You can sign in now.', 'Close', { duration: 4000 });
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('shows reset confirmation failure and supports resend', () => {
    auth.confirmPasswordReset.and.returnValue(throwError(() => ({ error: { message: 'Bad reset' } })));
    auth.requestPasswordResetOtp.and.returnValue(of({ message: 'Resent', expiresInSeconds: 60 }));
    component.otpSent = true;
    component.form.get('otp')?.setValidators([]);
    component.form.get('password')?.setValidators([]);
    component.form.get('confirmPassword')?.setValidators([]);
    component.form.patchValue({
      email: 'user@example.com',
      otp: '123456',
      password: 'Strong@123',
      confirmPassword: 'Strong@123'
    });

    component.onSubmit();
    expect(snack.open).toHaveBeenCalledWith('Bad reset', 'Close', { duration: 4000 });

    component.loading = false;
    component.resendOtp();
    expect(auth.requestPasswordResetOtp).toHaveBeenCalledWith('user@example.com');
  });
});
