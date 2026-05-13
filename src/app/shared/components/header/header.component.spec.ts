import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { HeaderComponent } from './header.component';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { User } from '../../../core/models/user.model';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let component: HeaderComponent;
  let store: MockStore;
  let authService: jasmine.SpyObj<AuthService> & { currentUser$: BehaviorSubject<User | null> };
  let notificationService: jasmine.SpyObj<NotificationService> & { unreadCount$: BehaviorSubject<number> };

  const user: User = {
    id: 1,
    fullName: 'Prashant Kumar',
    email: 'prashant@example.com',
    username: 'prashant',
    avatarUrl: 'https://example.com/avatar.png',
    role: 'PLATFORM_ADMIN',
    provider: 'LOCAL',
    isActive: true,
    createdAt: '2026-05-04T00:00:00Z'
  };

  beforeEach(async () => {
    authService = Object.assign(
      jasmine.createSpyObj<AuthService>('AuthService', ['getHomeRoute', 'isPlatformAdmin', 'logout', 'getAvatarRevision']),
      { currentUser$: new BehaviorSubject<User | null>(user) }
    );

    notificationService = Object.assign(
      jasmine.createSpyObj<NotificationService>('NotificationService', ['getUnreadCount', 'startPolling', 'stopPolling']),
      { unreadCount$: new BehaviorSubject<number>(2) }
    );

    authService.getHomeRoute.and.returnValue('/dashboard');
    authService.isPlatformAdmin.and.callFake((target?: User | null) => target?.role === 'PLATFORM_ADMIN');
    authService.getAvatarRevision.and.returnValue('456');
    notificationService.getUnreadCount.and.returnValue(of({ count: 2 }));

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideRouter([]),
        provideMockStore({
          initialState: {
            board: {
              board: null,
              lists: [],
              cards: [],
              loading: false,
              error: null
            }
          }
        }),
        { provide: AuthService, useValue: authService },
        { provide: NotificationService, useValue: notificationService }
      ]
    }).compileComponents();

    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads unread count and starts polling on init', () => {
    expect(notificationService.getUnreadCount).toHaveBeenCalled();
    expect(notificationService.startPolling).toHaveBeenCalled();
  });

  it('toggles and closes the notification popover', () => {
    expect(component.notificationsOpen).toBeFalse();

    component.toggleNotifications();
    expect(component.notificationsOpen).toBeTrue();

    component.onDocumentClick();
    expect(component.notificationsOpen).toBeFalse();
  });

  it('hides the header on downward scroll and shows it again on upward scroll', () => {
    spyOnProperty(window, 'scrollY', 'get').and.returnValues(5, 80, 20);

    component.onWindowScroll();
    expect(component.headerHidden).toBeFalse();

    component.onWindowScroll();
    expect(component.headerHidden).toBeTrue();

    component.onWindowScroll();
    expect(component.headerHidden).toBeFalse();
  });

  it('builds initials and avatar backgrounds correctly', () => {
    expect(component.getInitials('Prashant Kumar')).toBe('PK');
    expect(component.getInitials('single')).toBe('S');
    expect(component.getInitials(undefined)).toBe('?');
    expect(component.getResolvedAvatarUrl(undefined)).toBeNull();
    expect(component.getResolvedAvatarUrl(user.avatarUrl)).toContain('avatarRev=456');
    expect(component.getResolvedAvatarUrl('http://example.com/avatar.png')).toContain('avatarRev=456');
    expect(component.getResolvedAvatarUrl('javascript:alert(1)')).toBeNull();
    expect(component.getResolvedAvatarUrl('not a url')).toBeNull();
    component.markAvatarFailed(user.avatarUrl);
    expect(component.getResolvedAvatarUrl(user.avatarUrl)).toBeNull();
  });

  it('keeps the default header theme when no board is active', () => {
    expect(component.useLightTheme).toBeFalse();
    expect(component.headerBackground).toContain('#0a0f1e');
  });

  it('adapts the header colors to the active board background', () => {
    store.setState({
      board: {
        board: {
          id: 7,
          name: 'Roadmap',
          workspaceId: 2,
          createdById: 1,
          background: '#FDE68A',
          visibility: 'PRIVATE',
          isClosed: false,
          members: [],
          createdAt: '2026-05-04T00:00:00Z'
        },
        lists: [],
        cards: [],
        loading: false,
        error: null
      }
    });
    store.refreshState();
    fixture.detectChanges();

    expect(component.useLightTheme).toBeTrue();
    expect(component.headerBackground).toContain('rgba(253, 230, 138');
    expect(component.headerBorderColor).toBe('rgba(15, 23, 42, 0.10)');
  });

  it('stops polling on destroy', () => {
    component.ngOnDestroy();

    expect(notificationService.stopPolling).toHaveBeenCalled();
  });
});
