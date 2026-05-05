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
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['getCurrentUser', 'fetchProfile', 'updateProfile']);
    snack = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    auth.getCurrentUser.and.returnValue(currentUser);
    auth.fetchProfile.and.returnValue(of(user));
    auth.updateProfile.and.returnValue(of(user));
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
    expect(component.getAvatarBackgroundImage(undefined)).toBeNull();
    expect(component.getAvatarBackgroundImage('https://example.com/a.png')).toContain('url("https://example.com/a.png")');
    expect(component.getAvatarBackgroundImage('http://example.com/a.png')).toContain('url("http://example.com/a.png")');
    expect(component.getAvatarBackgroundImage('javascript:alert(1)')).toBeNull();
    expect(component.getAvatarBackgroundImage('not a url')).toBeNull();
  });
});
