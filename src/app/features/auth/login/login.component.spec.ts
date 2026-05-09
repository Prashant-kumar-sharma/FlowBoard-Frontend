import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/auth/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let auth: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let snack: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['requestLoginOtp', 'verifyLoginOtp', 'getHomeRoute']);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    snack = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    auth.getHomeRoute.and.returnValue('/dashboard');

    component = new LoginComponent(
      new FormBuilder(),
      auth,
      router,
      ({ queryParams: of({ oauthError: 'OAuth failed' }) } as unknown as ActivatedRoute),
      snack
    );
  });

  it('shows oauth errors from query params', () => {
    expect(snack.open).toHaveBeenCalledWith('OAuth failed', 'Close', { duration: 5000 });
  });

  it('sanitizes otp input', () => {
    component.form.get('otp')?.setValue('12a3-4');
    component.sanitizeOtp();
    expect(component.form.get('otp')?.value).toBe('1234');
  });

  it('does not submit while invalid or loading', () => {
    component.loading = true;
    component.onSubmit();
    component.loading = false;
    component.form.get('email')?.setValue('');
    component.onSubmit();
    expect(auth.requestLoginOtp).not.toHaveBeenCalled();
    expect(auth.verifyLoginOtp).not.toHaveBeenCalled();
  });

  it('requests login otp successfully', () => {
    auth.requestLoginOtp.and.returnValue(of({ message: 'Code sent', expiresInSeconds: 60 }));
    component.form.get('email')?.setValue('user@example.com');

    component.onSubmit();

    expect(auth.requestLoginOtp).toHaveBeenCalledWith({ email: 'user@example.com', password: '' });
    expect(component.otpSent).toBeTrue();
    expect(component.submittedEmail).toBe('user@example.com');
    expect(component.form.get('otp')?.validator).toBeTruthy();
    expect(component.loading).toBeFalse();
    expect(snack.open).toHaveBeenCalledWith('Code sent', 'Close', { duration: 4000 });
  });

  it('shows request otp failure', () => {
    auth.requestLoginOtp.and.returnValue(throwError(() => ({ error: { message: 'Nope' } })));
    component.form.get('email')?.setValue('user@example.com');

    component.onSubmit();

    expect(snack.open).toHaveBeenCalledWith('Nope', 'Close', { duration: 4000 });
    expect(component.loading).toBeFalse();
  });

  it('resends otp through the same request path', () => {
    auth.requestLoginOtp.and.returnValue(of({ message: 'Again', expiresInSeconds: 60 }));
    component.form.get('email')?.setValue('user@example.com');

    component.resendOtp();

    expect(auth.requestLoginOtp).toHaveBeenCalledWith({ email: 'user@example.com', password: '' });
  });

  it('does not resend while loading', () => {
    component.loading = true;

    component.resendOtp();

    expect(auth.requestLoginOtp).not.toHaveBeenCalled();
  });

  it('uses the default success and failure messages for otp requests', () => {
    auth.requestLoginOtp.and.returnValue(of({ message: '', expiresInSeconds: 60 }));
    component.form.get('email')?.setValue('user@example.com');

    component.onSubmit();
    expect(snack.open).toHaveBeenCalledWith('Sign-in code sent to your email.', 'Close', { duration: 4000 });

    auth.requestLoginOtp.and.returnValue(throwError(() => ({ error: {} })));
    component.loading = false;
    component.otpSent = false;

    component.onSubmit();
    expect(snack.open).toHaveBeenCalledWith('Failed to send sign-in code', 'Close', { duration: 4000 });
  });

  it('verifies otp and navigates on success', () => {
    auth.verifyLoginOtp.and.returnValue(of({ accessToken: 't', tokenType: 'Bearer', user: {} as any }));
    component.otpSent = true;
    component.form.get('otp')?.setValidators([]);
    component.form.patchValue({ email: 'user@example.com', otp: '123456' });

    component.onSubmit();

    expect(auth.verifyLoginOtp).toHaveBeenCalledWith('user@example.com', '123456');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('does not verify invalid otp and shows verification errors', () => {
    component.otpSent = true;
    component.form.get('otp')?.setValidators([() => ({ pattern: true })]);
    component.form.get('otp')?.updateValueAndValidity();
    component.form.patchValue({ email: 'user@example.com', otp: '12' });
    component.onSubmit();
    expect(auth.verifyLoginOtp).not.toHaveBeenCalled();

    component.form.get('otp')?.setValidators([]);
    component.form.patchValue({ otp: '123456' });
    auth.verifyLoginOtp.and.returnValue(throwError(() => ({ error: { message: 'Bad code' } })));

    component.onSubmit();

    expect(snack.open).toHaveBeenCalledWith('Bad code', 'Close', { duration: 4000 });
    expect(component.loading).toBeFalse();
  });

  it('uses the default verification failure message when the backend does not provide one', () => {
    component.otpSent = true;
    component.form.get('otp')?.setValidators([]);
    component.form.patchValue({ email: 'user@example.com', otp: '123456' });
    auth.verifyLoginOtp.and.returnValue(throwError(() => ({ error: {} })));

    component.onSubmit();

    expect(snack.open).toHaveBeenCalledWith('Login failed', 'Close', { duration: 4000 });
    expect(component.loading).toBeFalse();
  });
});
