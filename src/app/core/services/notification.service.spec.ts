import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NotificationService } from './notification.service';
import { Notification } from '../models/notification.model';

describe('NotificationService', () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;
  const baseUrl = 'http://localhost:8080/api/v1/notifications';

  const mockNotifications: Notification[] = [
    {
      id: 1,
      recipientId: 7,
      type: 'ASSIGNMENT',
      title: 'New Assignment',
      message: 'You have been assigned to "Launch plan".',
      isRead: false,
      createdAt: '2026-05-04T00:00:00Z'
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        NotificationService
      ]
    });

    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    service.stopPolling();
    httpMock.verify();
  });

  it('loads all notifications', () => {
    let result: Notification[] | undefined;

    service.getAll().subscribe((notifications) => {
      result = notifications;
    });

    const request = httpMock.expectOne(`${baseUrl}`);
    expect(request.request.method).toBe('GET');
    request.flush(mockNotifications);

    expect(result).toEqual(mockNotifications);
  });

  it('updates unread count when fetching unread count', () => {
    let result: { count: number } | undefined;

    service.getUnreadCount().subscribe((response) => {
      result = response;
    });

    const request = httpMock.expectOne(`${baseUrl}/unread-count`);
    expect(request.request.method).toBe('GET');
    request.flush({ count: 4 });

    expect(result).toEqual({ count: 4 });
    expect(service.unreadCount$.value).toBe(4);
  });

  it('decrements unread count when marking a notification as read', () => {
    service.unreadCount$.next(3);

    service.markRead(9).subscribe();

    const request = httpMock.expectOne(`${baseUrl}/9/read`);
    expect(request.request.method).toBe('PATCH');
    request.flush({});

    expect(service.unreadCount$.value).toBe(2);
  });

  it('does not decrement unread count below zero when marking as read', () => {
    service.unreadCount$.next(0);

    service.markRead(9).subscribe();

    const request = httpMock.expectOne(`${baseUrl}/9/read`);
    request.flush({});

    expect(service.unreadCount$.value).toBe(0);
  });

  it('marks all notifications as read and resets unread count', () => {
    service.unreadCount$.next(5);

    service.markAllRead().subscribe();

    const request = httpMock.expectOne(`${baseUrl}/read-all`);
    expect(request.request.method).toBe('PATCH');
    request.flush({});

    expect(service.unreadCount$.value).toBe(0);
  });

  it('deletes read notifications', () => {
    service.deleteRead().subscribe();

    const request = httpMock.expectOne(`${baseUrl}/read`);
    expect(request.request.method).toBe('DELETE');
    request.flush({});
  });

  it('starts polling unread count and avoids starting twice', fakeAsync(() => {
    service.startPolling();
    service.startPolling();

    tick(30_000);

    const request = httpMock.expectOne(`${baseUrl}/unread-count`);
    request.flush({ count: 6 });

    expect(service.unreadCount$.value).toBe(6);

    tick(30_000);

    const secondRequest = httpMock.expectOne(`${baseUrl}/unread-count`);
    secondRequest.flush({ count: 7 });

    expect(service.unreadCount$.value).toBe(7);
    service.stopPolling();
  }));

  it('keeps the previous unread count when a polling request fails', fakeAsync(() => {
    service.unreadCount$.next(2);
    service.startPolling();

    tick(30_000);

    const request = httpMock.expectOne(`${baseUrl}/unread-count`);
    request.flush('boom', { status: 500, statusText: 'Server Error' });

    expect(service.unreadCount$.value).toBe(2);
    service.stopPolling();
  }));

  it('stops polling and cleans up on destroy', fakeAsync(() => {
    service.startPolling();
    service.ngOnDestroy();

    tick(30_000);

    httpMock.expectNone(`${baseUrl}/unread-count`);
    expect(service.unreadCount$.value).toBe(0);
  }));
});
