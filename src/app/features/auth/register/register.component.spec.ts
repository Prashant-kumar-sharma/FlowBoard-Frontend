import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../../core/auth/auth.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let auth: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let snack: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['requestRegistrationOtp', 'verifyRegistrationOtp', 'getHomeRoute']);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    snack = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    auth.getHomeRoute.and.returnValue('/dashboard');

    component = new RegisterComponent(new FormBuilder(), auth, router, snack);
  });

  function fillValidForm(): void {
    component.form.patchValue({
      fullName: 'Prashant Kumar',
      email: 'prashant@example.com',
      username: 'prashant_1',
      password: 'Strong@123',
      otp: '123456'
    });
  }

  it('sanitizes full name, username, and otp', () => {
    component.form.patchValue({ fullName: 'Pr4shant@ Kumar', username: 'abc-12!', otp: '1a2b3c' });
    component.sanitizeFullName();
    component.sanitizeUsername();
    component.sanitizeOtp();

    expect(component.form.get('fullName')?.value).toBe('Prshant Kumar');
    expect(component.form.get('username')?.value).toBe('abc12');
    expect(component.form.get('otp')?.value).toBe('123');
  });

  it('exposes email and password validation messages and strength helpers', () => {
    component.form.get('email')?.setValue('invalid');
    component.form.get('email')?.markAsTouched();
    expect(component.emailMessage).toBe('Email must include @');

    component.form.get('password')?.setValue('abc');
    component.form.get('password')?.markAsTouched();
    expect(component.passwordMessage).toBe('Use at least 8 characters');
    expect(component.showPasswordStrength).toBeTrue();
    expect(component.passwordStrengthLabel).toBe('Weak');
    expect(component.passwordStrengthClass).toBe('weak');

    component.form.get('password')?.setValue('VeryStrong@123');
    expect(component.passwordStrengthLabel).toBe('Strong');
    expect(component.passwordStrengthPercent).toBe(100);
  });

  it('covers the remaining email validation messages', () => {
    const email = component.form.get('email');

    email?.setValue('name@');
    email?.markAsTouched();
    expect(component.emailMessage).toBe('Email must include a domain after @');

    email?.setValue('name@example');
    expect(component.emailMessage).toBe('Email domain must include a full stop');

    email?.setValue('name@@example.com');
    expect(component.emailMessage).toBe('Enter a valid email address, for example name@example.com');

    email?.setValue('.name@example.com');
    expect(component.emailMessage).toBe('Enter a valid email address, for example name@example.com');

    email?.setValue('name@example..com');
    expect(component.emailMessage).toBe('Enter a valid email address, for example name@example.com');

    email?.setValue('name@example.c');
    expect(component.emailMessage).toBe('Enter a valid email address, for example name@example.com');

    email?.setValue('name @example.com');
    expect(component.emailMessage).toBe('Enter a valid email address, for example name@example.com');

    email?.setValue('');
    expect(component.emailMessage).toBe('');
  });

  it('covers the remaining password validation messages and fair strength state', () => {
    const password = component.form.get('password');

    password?.setValue('ALLUPPER1!');
    password?.markAsTouched();
    expect(component.passwordMessage).toBe('Add at least one lowercase letter');

    password?.setValue('lowercase1!');
    expect(component.passwordMessage).toBe('Add at least one uppercase letter');

    password?.setValue('Lowercase!');
    expect(component.passwordMessage).toBe('Add at least one number');

    password?.setValue('Lowercase1');
    expect(component.passwordMessage).toBe('Add at least one special character');

    password?.setValue('Abcdef12');
    expect(component.passwordStrengthLabel).toBe('Fair');
    expect(component.passwordStrengthClass).toBe('fair');
    expect(component.passwordStrengthPercent).toBe(80);
  });

  it('marks the form touched when invalid and does not submit', () => {
    component.onSubmit();
    expect(auth.requestRegistrationOtp).not.toHaveBeenCalled();
    expect(component.form.touched).toBeTrue();
  });

  it('does not submit while already loading', () => {
    fillValidForm();
    component.loading = true;

    component.onSubmit();

    expect(auth.requestRegistrationOtp).not.toHaveBeenCalled();
    expect(component.form.touched).toBeTrue();
  });

  it('requests registration otp successfully', () => {
    auth.requestRegistrationOtp.and.returnValue(of({ message: 'Sent', expiresInSeconds: 60 }));
    fillValidForm();
    component.form.patchValue({ otp: '' });

    component.onSubmit();

    expect(auth.requestRegistrationOtp).toHaveBeenCalled();
    expect(component.otpSent).toBeTrue();
    expect(component.submittedEmail).toBe('prashant@example.com');
    expect(snack.open).toHaveBeenCalledWith('Sent', 'Close', { duration: 4000 });
  });

  it('uses the default success message when otp response has no message', () => {
    auth.requestRegistrationOtp.and.returnValue(of({ message: '', expiresInSeconds: 60 }));
    fillValidForm();
    component.form.patchValue({ otp: '' });

    component.onSubmit();

    expect(snack.open).toHaveBeenCalledWith('Verification code sent to your email.', 'Close', { duration: 4000 });
  });

  it('shows registration otp request failure', () => {
    auth.requestRegistrationOtp.and.returnValue(throwError(() => ({ error: { message: 'Failed send' } })));
    fillValidForm();
    component.form.patchValue({ otp: '' });

    component.onSubmit();

    expect(snack.open).toHaveBeenCalledWith('Failed send', 'Close', { duration: 4000 });
    expect(component.loading).toBeFalse();
  });

  it('uses the default otp request failure message when the backend does not provide one', () => {
    auth.requestRegistrationOtp.and.returnValue(throwError(() => ({ error: {} })));
    fillValidForm();
    component.form.patchValue({ otp: '' });

    component.onSubmit();

    expect(snack.open).toHaveBeenCalledWith('Failed to send verification code', 'Close', { duration: 4000 });
  });

  it('verifies otp and navigates on success', () => {
    auth.verifyRegistrationOtp.and.returnValue(of({ accessToken: 't', tokenType: 'Bearer', user: {} as any }));
    component.otpSent = true;
    fillValidForm();

    component.onSubmit();

    expect(auth.verifyRegistrationOtp).toHaveBeenCalledWith('prashant@example.com', '123456');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('does not verify otp when the otp field is invalid', () => {
    component.otpSent = true;
    fillValidForm();
    component.form.get('otp')?.setValidators([() => ({ pattern: true })]);
    component.form.get('otp')?.updateValueAndValidity();

    component.onSubmit();

    expect(auth.verifyRegistrationOtp).not.toHaveBeenCalled();
    expect(component.form.get('otp')?.touched).toBeTrue();
  });

  it('shows verification failure and supports resend', () => {
    auth.verifyRegistrationOtp.and.returnValue(throwError(() => ({ error: { message: 'Bad verification' } })));
    auth.requestRegistrationOtp.and.returnValue(of({ message: 'Again', expiresInSeconds: 60 }));
    component.otpSent = true;
    fillValidForm();

    component.onSubmit();
    expect(snack.open).toHaveBeenCalledWith('Bad verification', 'Close', { duration: 4000 });

    component.loading = false;
    component.resendOtp();
    expect(auth.requestRegistrationOtp).toHaveBeenCalled();
  });

  it('uses the default verification failure message when the backend does not provide one', () => {
    auth.verifyRegistrationOtp.and.returnValue(throwError(() => ({ error: {} })));
    component.otpSent = true;
    fillValidForm();

    component.onSubmit();

    expect(snack.open).toHaveBeenCalledWith('Verification failed', 'Close', { duration: 4000 });
    expect(component.loading).toBeFalse();
  });

  it('does not resend otp while loading', () => {
    component.loading = true;

    component.resendOtp();

    expect(auth.requestRegistrationOtp).not.toHaveBeenCalled();
  });
});
