import { AppComponent } from './app.component';

describe('AppComponent', () => {
  it('shows the header for an active user', () => {
    const authService = {
      getCurrentUser: () => ({ isActive: true }),
      isLoggedIn: () => false,
      ensureCurrentUserLoaded: jasmine.createSpy('ensureCurrentUserLoaded')
    };

    const component = new AppComponent(authService as any);

    expect(component.showHeader).toBeTrue();
  });

  it('hides the header for an inactive user', () => {
    const authService = {
      getCurrentUser: () => ({ isActive: false }),
      isLoggedIn: () => false,
      ensureCurrentUserLoaded: jasmine.createSpy('ensureCurrentUserLoaded')
    };

    const component = new AppComponent(authService as any);

    expect(component.showHeader).toBeFalse();
  });

  it('loads the current user on init when logged in', () => {
    const ensureCurrentUserLoaded = jasmine.createSpy('ensureCurrentUserLoaded');
    const authService = {
      getCurrentUser: () => null,
      isLoggedIn: () => true,
      ensureCurrentUserLoaded
    };

    const component = new AppComponent(authService as any);
    component.ngOnInit();

    expect(ensureCurrentUserLoaded).toHaveBeenCalled();
  });
});
