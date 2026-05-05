import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { OAuthCallbackComponent } from './oauth-callback.component';
import { AuthService } from '../../../core/auth/auth.service';

describe('OAuthCallbackComponent', () => {
  it('handles the oauth token when present', () => {
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    const auth = jasmine.createSpyObj<AuthService>('AuthService', ['handleOAuthCallback']);
    const route = { queryParams: of({ token: 'oauth-token' }) } as unknown as ActivatedRoute;

    const component = new OAuthCallbackComponent(route, router, auth);
    component.ngOnInit();

    expect(auth.handleOAuthCallback).toHaveBeenCalledWith('oauth-token');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('redirects to login when the token is missing', () => {
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    const auth = jasmine.createSpyObj<AuthService>('AuthService', ['handleOAuthCallback']);
    const route = { queryParams: of({}) } as unknown as ActivatedRoute;

    const component = new OAuthCallbackComponent(route, router, auth);
    component.ngOnInit();

    expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], {
      queryParams: { oauthError: 'Missing OAuth token. Please try again.' }
    });
  });
});
