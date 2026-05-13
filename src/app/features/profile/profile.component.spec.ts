import { ProfileComponent } from './profile.component';
import { AuthService } from '../../core/auth/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { User } from '../../core/models/user.model';
import { of, throwError } from 'rxjs';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let auth: jasmine.SpyObj<AuthService>;
  let snack: jasmine.SpyObj<MatSnackBar>;

  const user: User = {
    id: 1,
    fullName: 'Prashant Kumar',
    email: 'prashant@example.com',
    username: 'prashant',
    avatarUrl: 'https://example.com/a.png',
    bio: 'Hello',
    role: 'MEMBER',
    provider: 'LOCAL',
    isActive: true,
    createdAt: '2026-05-04T00:00:00Z'
  };

  function createComponent(currentUser: User | null = user) {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['getCurrentUser', 'fetchProfile', 'updateProfile', 'changePassword', 'getAvatarRevision']);
    snack = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    auth.getCurrentUser.and.returnValue(currentUser);
    auth.fetchProfile.and.returnValue(of(user));
    auth.updateProfile.and.returnValue(of(user));
    auth.changePassword.and.returnValue(of(void 0));
    auth.getAvatarRevision.and.returnValue('123');
    component = new ProfileComponent(auth, snack);
  }

  it('loads the current user into the form', () => {
    createComponent();
    component.ngOnInit();
    expect(component.user).toEqual(user);
    expect(component.form.getRawValue().fullName).toBe('Prashant Kumar');
    expect(component.initials).toBe('P');
  });

  it('fetches profile when there is no cached current user', () => {
    createComponent(null);
    component.ngOnInit();
    expect(auth.fetchProfile).toHaveBeenCalled();
    expect(component.user?.email).toBe('prashant@example.com');
  });

  it('does not save while invalid', () => {
    createComponent();
    component.ngOnInit();
    component.form.get('fullName')?.setValue('');
    component.save();
    expect(auth.updateProfile).not.toHaveBeenCalled();
  });

  it('does not change password while invalid', () => {
    createComponent();
    component.ngOnInit();

    component.changePassword();

    expect(auth.changePassword).not.toHaveBeenCalled();
  });

  it('saves trimmed profile data successfully', () => {
    createComponent();
    component.ngOnInit();
    const updated = { ...user, fullName: 'Updated Name', username: 'updated', avatarUrl: '', bio: '' };
    auth.updateProfile.and.returnValue(of(updated as User));
    component.form.patchValue({
      fullName: ' Updated Name ',
      username: ' updated ',
      avatarUrl: ' ',
      bio: ' '
    });

    component.save();

    expect(auth.updateProfile).toHaveBeenCalledWith({
      fullName: 'Updated Name',
      username: 'updated',
      avatarUrl: undefined,
      bio: undefined
    });
    expect(component.user?.fullName).toBe('Updated Name');
    expect(component.saving).toBeFalse();
    expect(snack.open).toHaveBeenCalledWith('Profile updated', 'Close', { duration: 2500 });
  });

  it('shows save errors and returns avatar background safely', () => {
    createComponent();
    component.ngOnInit();
    auth.updateProfile.and.returnValue(throwError(() => ({ status: 500, message: 'Boom' })));

    component.save();

    expect(snack.open).toHaveBeenCalledWith('Boom', 'Close', { duration: 4500 });
    expect(component.saving).toBeFalse();
    expect(component.getResolvedAvatarUrl(undefined)).toBeNull();
    expect(component.getResolvedAvatarUrl('https://example.com/a.png')).toContain('avatarRev=123');
    expect(component.getResolvedAvatarUrl('http://example.com/a.png')).toContain('avatarRev=123');
    expect(component.getResolvedAvatarUrl('javascript:alert(1)')).toBeNull();
    expect(component.getResolvedAvatarUrl('not a url')).toBeNull();
    component.markAvatarFailed('https://example.com/a.png');
    expect(component.getResolvedAvatarUrl('https://example.com/a.png')).toBeNull();
  });

  it('changes the password and clears the form on success', () => {
    createComponent();
    component.ngOnInit();
    component.passwordForm.setValue({
      currentPassword: 'Old@1234',
      newPassword: 'New@1234',
      confirmPassword: 'New@1234'
    });

    component.changePassword();

    expect(auth.changePassword).toHaveBeenCalledWith('Old@1234', 'New@1234');
    expect(component.passwordForm.getRawValue()).toEqual({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    expect(component.changingPassword).toBeFalse();
    expect(snack.open).toHaveBeenCalledWith('Password updated successfully', 'Close', { duration: 3000 });
  });

  it('shows password validation and change-password errors', () => {
    createComponent();
    component.ngOnInit();

    const newPassword = component.passwordForm.get('newPassword');
    newPassword?.setValue('short');
    newPassword?.markAsTouched();
    expect(component.newPasswordMessage).toBe('Use at least 8 characters');

    component.passwordForm.setValue({
      currentPassword: 'Old@1234',
      newPassword: 'New@1234',
      confirmPassword: 'Mismatch@123'
    });
    component.changePassword();
    expect(auth.changePassword).not.toHaveBeenCalled();

    component.passwordForm.setValue({
      currentPassword: 'Old@1234',
      newPassword: 'New@1234',
      confirmPassword: 'New@1234'
    });
    auth.changePassword.and.returnValue(throwError(() => ({ error: { message: 'Current password is incorrect' } })));

    component.changePassword();

    expect(component.changingPassword).toBeFalse();
    expect(snack.open).toHaveBeenCalledWith('Current password is incorrect', 'Close', { duration: 4500 });
  });
});
