import { AuthService } from '../../../core/auth/auth.service';
import { AccountSuspendedComponent } from './account-suspended.component';

describe('AccountSuspendedComponent', () => {
  it('logs the user out', () => {
    const auth = jasmine.createSpyObj<AuthService>('AuthService', ['logout']);
    const component = new AccountSuspendedComponent(auth);

    component.logout();

    expect(auth.logout).toHaveBeenCalled();
  });
});
