import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription, interval, switchMap, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Notification } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  private readonly BASE = environment.services.notification;
  private readonly POLL_INTERVAL_MS = 30_000; // 30 seconds
  private pollSub: Subscription | null = null;

  unreadCount$ = new BehaviorSubject<number>(0);

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.BASE}/notifications`);
  }

  getUnreadCount(): Observable<{count: number}> {
    return this.http.get<{count: number}>(`${this.BASE}/notifications/unread-count`)
      .pipe(tap(r => this.unreadCount$.next(r.count)));
  }

  markRead(id: number): Observable<void> {
    return this.http.patch<void>(`${this.BASE}/notifications/${id}/read`, {})
      .pipe(tap(() => {
        const cur = this.unreadCount$.value;
        if (cur > 0) this.unreadCount$.next(cur - 1);
      }));
  }

  markAllRead(): Observable<void> {
    return this.http.patch<void>(`${this.BASE}/notifications/read-all`, {})
      .pipe(tap(() => this.unreadCount$.next(0)));
  }

  deleteRead(): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/notifications/read`);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/notifications/${id}`);
  }

  /** Start polling for unread count every 30 seconds */
  startPolling(): void {
    if (this.pollSub) {
      return; // already polling
    }

    this.pollSub = interval(this.POLL_INTERVAL_MS).pipe(
      switchMap(() => this.getUnreadCount().pipe(
        catchError(() => of({ count: this.unreadCount$.value }))
      ))
    ).subscribe();
  }

  /** Stop polling */
  stopPolling(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = null;
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }
}
