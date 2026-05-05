import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { NotificationService } from '../../core/services/notification.service';
import { Notification } from '../../core/models/notification.model';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatDividerModule, MatIconModule, TimeAgoPipe],
  template: `
    <section class="notification-panel">
      <div class="panel-header">
        <div class="heading-copy">
          <div class="heading-topline">
            <h3>Notifications</h3>
            <div class="heading-badge" *ngIf="unreadCount > 0">{{ unreadCount }}</div>
          </div>
          <p>{{ unreadCount }} unread</p>
        </div>
      </div>

      <div class="panel-actions">
        <button class="action-chip"
                type="button"
                [class.is-disabled]="unreadCount === 0"
                [disabled]="unreadCount === 0"
                (click)="markAllRead()">
          Mark all as read
        </button>
        <button class="action-chip action-chip-secondary"
                type="button"
                [class.is-disabled]="!hasReadNotifications"
                [disabled]="!hasReadNotifications"
                (click)="deleteRead()">
          Delete read
        </button>
      </div>

      <div class="panel-body">
        <div *ngIf="notifications.length === 0" class="empty-state">
          <div class="empty-icon">
            <mat-icon>notifications_none</mat-icon>
          </div>
          <p class="empty-title">No notifications yet</p>
          <p class="empty-copy">You are all caught up for now.</p>
        </div>

        <div *ngFor="let n of notifications"
             class="notification-row"
             [class.unread]="!n.isRead"
             (click)="handleClick(n)">
          <div class="row-accent" [ngClass]="accentClass(n.type)">
            <mat-icon>{{ typeIcon(n.type) }}</mat-icon>
          </div>

          <div class="row-content">
            <div class="row-meta">
              <span class="type-pill" [ngClass]="typeClass(n.type)">{{ typeLabel(n.type) }}</span>
              <span class="row-time">{{ n.createdAt | timeAgo }}</span>
            </div>
            <p class="row-title">{{ n.title }}</p>
            <p class="row-message" [innerHTML]="formatMessage(n.message)"></p>
          </div>

          <div class="unread-dot" *ngIf="!n.isRead"></div>
        </div>
      </div>
      <div class="panel-footer">
        <div class="footer-summary">{{ notifications.length }} total notifications</div>
      </div>
    </section>
  `,
  styles: [`
    .notification-panel {
      width: 26rem;
      max-width: min(26rem, calc(100vw - 1rem));
      overflow: hidden;
      border: 1px solid rgba(226, 232, 240, 0.9);
      border-radius: 16px;
      background: #ffffff;
      box-shadow: 0 18px 48px rgba(15, 23, 42, 0.16), 0 6px 18px rgba(15, 23, 42, 0.08);
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem 1.1rem 0.9rem;
      border-bottom: 1px solid rgba(226, 232, 240, 0.9);
    }

    .heading-copy {
      min-width: 0;
      flex: 1;
    }

    .heading-topline {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-width: 0;
    }

    .heading-copy h3 {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 700;
      color: #1e293b;
    }

    .heading-copy p {
      margin: 0.2rem 0 0;
      font-size: 0.78rem;
      font-weight: 600;
      color: #64748b;
    }

    .heading-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 1.35rem;
      height: 1.35rem;
      padding: 0 0.35rem;
      border-radius: 999px;
      background: linear-gradient(135deg, #0284c7, #38bdf8);
      color: #fff;
      font-size: 0.68rem;
      font-weight: 700;
      box-shadow: 0 6px 14px rgba(14, 165, 233, 0.22);
    }

    .panel-actions {
      display: flex;
      gap: 0.65rem;
      padding: 0.8rem 1.1rem 0.9rem;
      border-bottom: 1px solid rgba(226, 232, 240, 0.8);
      background: #f8fafc;
    }

    .action-chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 2rem;
      padding: 0 0.85rem;
      border: 1px solid #bae6fd;
      border-radius: 999px;
      background: #eff6ff;
      color: #0369a1;
      font-size: 0.77rem;
      font-weight: 700;
      white-space: nowrap;
      cursor: pointer;
      transition: background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease, opacity 0.18s ease;
    }

    .action-chip:hover:not(:disabled) {
      background: #dbeafe;
      border-color: #7dd3fc;
    }

    .action-chip-secondary {
      border-color: #cbd5e1;
      background: #ffffff;
      color: #475569;
    }

    .action-chip-secondary:hover:not(:disabled) {
      background: #f8fafc;
      border-color: #94a3b8;
    }

    .action-chip.is-disabled,
    .action-chip:disabled {
      opacity: 0.55;
      cursor: default;
    }

    .panel-body {
      max-height: 24rem;
      overflow-y: auto;
      padding: 0.55rem;
    }

    .empty-state {
      display: flex;
      min-height: 13rem;
      padding: 2rem 1.4rem;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      text-align: center;
    }

    .empty-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 3.1rem;
      height: 3.1rem;
      border-radius: 12px;
      background: #eff6ff;
      color: #0284c7;
      box-shadow: inset 0 0 0 1px rgba(125, 211, 252, 0.55);
    }

    .empty-icon mat-icon {
      font-size: 1.45rem;
      width: 1.45rem;
      height: 1.45rem;
    }

    .empty-title {
      margin: 0.9rem 0 0;
      font-size: 1.05rem;
      font-weight: 700;
      color: #1e293b;
    }

    .empty-copy {
      max-width: 18rem;
      margin: 0.35rem 0 0;
      font-size: 0.84rem;
      line-height: 1.45;
      color: #94a3b8;
    }

    .notification-row {
      display: grid;
      grid-template-columns: 2.25rem minmax(0, 1fr) auto;
      gap: 0.9rem;
      align-items: flex-start;
      padding: 0.95rem;
      border-radius: 12px;
      cursor: pointer;
      transition: transform 0.18s ease, background-color 0.18s ease, box-shadow 0.18s ease;
    }

    .notification-row + .notification-row {
      margin-top: 0.35rem;
    }

    .notification-row:hover {
      background: rgba(248, 250, 252, 0.96);
      transform: translateY(-1px);
      box-shadow: inset 0 0 0 1px rgba(226, 232, 240, 0.7);
    }

    .notification-row.unread {
      background: linear-gradient(135deg, rgba(240, 249, 255, 0.95), rgba(248, 250, 252, 0.98));
      box-shadow: inset 0 0 0 1px rgba(186, 230, 253, 0.85);
    }

    .row-accent {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 12px;
      color: #0f172a;
      flex-shrink: 0;
    }

    .row-accent mat-icon {
      font-size: 1.05rem;
      width: 1.05rem;
      height: 1.05rem;
    }

    .accent-assignment { background: #dbeafe; color: #1d4ed8; }
    .accent-mention { background: #fef3c7; color: #b45309; }
    .accent-due { background: #fee2e2; color: #b91c1c; }
    .accent-broadcast { background: #e2e8f0; color: #475569; }
    .accent-moved { background: #dcfce7; color: #15803d; }
    .accent-comment { background: #ede9fe; color: #6d28d9; }

    .row-content {
      min-width: 0;
    }

    .row-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .type-pill {
      display: inline-flex;
      align-items: center;
      min-height: 1.3rem;
      padding: 0.12rem 0.5rem;
      border-radius: 999px;
      font-size: 0.66rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .row-time {
      flex-shrink: 0;
      font-size: 0.7rem;
      font-weight: 600;
      color: #94a3b8;
    }

    .row-title {
      margin: 0.35rem 0 0;
      font-size: 0.9rem;
      font-weight: 700;
      line-height: 1.35;
      color: #1e293b;
    }

    .row-message {
      margin: 0.22rem 0 0;
      font-size: 0.79rem;
      line-height: 1.45;
      color: #64748b;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .row-message :is(strong, .message-entity) {
      color: #0f172a;
      font-weight: 700;
    }

    .unread-dot {
      width: 0.55rem;
      height: 0.55rem;
      margin-top: 0.45rem;
      border-radius: 999px;
      background: #0ea5e9;
      box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.14);
    }

    .panel-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.85rem 1.1rem 0.95rem;
      border-top: 1px solid rgba(226, 232, 240, 0.9);
      background: #f8fafc;
    }

    .footer-summary {
      font-size: 0.7rem;
      font-weight: 700;
      color: #94a3b8;
      letter-spacing: 0.04em;
    }
  `]
})
export class NotificationPanelComponent implements OnInit {
  notifications: Notification[] = [];

  constructor(
    public notificationService: NotificationService,
    private readonly dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.notificationService.getAll().subscribe(n => this.notifications = n);
  }

  markAllRead(): void {
    this.notificationService.markAllRead().subscribe(() => {
      this.notifications = this.notifications.map(n => ({ ...n, isRead: true }));
    });
  }

  handleClick(n: Notification): void {
    if (!n.isRead) {
      this.notificationService.markRead(n.id).subscribe();
      n.isRead = true;
    }

    this.dialog.open(NotificationDetailDialogComponent, {
      data: n,
      width: 'min(92vw, 34rem)',
      maxWidth: '92vw',
      autoFocus: false,
      panelClass: 'notification-detail-dialog-panel',
    });
  }

  deleteRead(): void {
    this.notificationService.deleteRead().subscribe(() => {
      this.notifications = this.notifications.filter(n => !n.isRead);
    });
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  get hasReadNotifications(): boolean {
    return this.notifications.some(n => n.isRead);
  }

  typeLabel(type: string): string {
    return formatNotificationTypeLabel(type);
  }

  typeIcon(type: string): string {
    return notificationTypeIcon(type);
  }

  accentClass(type: string): string {
    return notificationAccentClass(type);
  }

  typeClass(type: string): object {
    return {
      'bg-blue-100 text-blue-700': type === 'ASSIGNMENT',
      'bg-yellow-100 text-yellow-700': type === 'MENTION',
      'bg-red-100 text-red-700': type === 'DUE_DATE',
      'bg-gray-100 text-gray-600': type === 'BROADCAST',
      'bg-green-100 text-green-700': type === 'CARD_MOVED',
      'bg-violet-100 text-violet-700': type === 'COMMENT_REPLY',
    };
  }

  formatMessage(message: string): string {
    return emphasizeQuotedText(message);
  }
}

@Component({
  selector: 'app-notification-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, TimeAgoPipe],
  template: `
    <div class="notification-detail-shell">
      <div class="detail-hero" [ngClass]="accentClass(data.type)">
        <div class="detail-icon-wrap">
          <mat-icon>{{ typeIcon(data.type) }}</mat-icon>
        </div>
        <div class="detail-hero-copy">
          <p class="detail-eyebrow">{{ typeLabel(data.type) }}</p>
          <h2 mat-dialog-title>{{ data.title }}</h2>
          <p class="detail-time">{{ data.createdAt | timeAgo }}</p>
        </div>
      </div>

      <mat-dialog-content class="detail-content">
        <p class="detail-message" [innerHTML]="formatMessage(data.message)"></p>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="detail-actions">
        <button mat-flat-button color="primary" type="button" (click)="dialogRef.close()">
          Close
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .notification-detail-shell {
      overflow: hidden;
      border-radius: 26px;
      background: #ffffff;
      box-shadow: 0 26px 70px rgba(15, 23, 42, 0.24);
    }

    .detail-hero {
      display: grid;
      grid-template-columns: 3.25rem minmax(0, 1fr);
      gap: 1rem;
      align-items: start;
      padding: 1.5rem 1.5rem 1.2rem;
      color: #0f172a;
    }

    .detail-icon-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 3.25rem;
      height: 3.25rem;
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.7);
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.55);
    }

    .detail-icon-wrap mat-icon {
      font-size: 1.4rem;
      width: 1.4rem;
      height: 1.4rem;
    }

    .detail-hero-copy {
      min-width: 0;
    }

    .detail-eyebrow {
      margin: 0 0 0.35rem;
      font-size: 0.73rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      opacity: 0.85;
    }

    h2 {
      margin: 0;
      font-size: 1.45rem;
      line-height: 1.25;
      font-weight: 800;
      color: #0f172a;
    }

    .detail-time {
      margin: 0.55rem 0 0;
      font-size: 0.82rem;
      font-weight: 700;
      color: rgba(15, 23, 42, 0.64);
    }

    .detail-content {
      padding: 0 1.5rem 1rem !important;
    }

    .detail-message {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
      font-size: 0.98rem;
      line-height: 1.75;
      color: #334155;
    }

    .detail-message :is(strong, .message-entity) {
      color: #0f172a;
      font-weight: 700;
    }

    .detail-actions {
      padding: 0 1.5rem 1.5rem !important;
    }

    .detail-actions button {
      min-width: 7rem;
      height: 2.8rem;
      border-radius: 12px;
      font-weight: 700;
    }

    .accent-assignment {
      background: linear-gradient(135deg, #dbeafe, #eff6ff);
    }

    .accent-mention {
      background: linear-gradient(135deg, #fef3c7, #fffbeb);
    }

    .accent-due {
      background: linear-gradient(135deg, #fee2e2, #fff1f2);
    }

    .accent-broadcast {
      background: linear-gradient(135deg, #e2e8f0, #f8fafc);
    }

    .accent-moved {
      background: linear-gradient(135deg, #dcfce7, #f0fdf4);
    }

    .accent-comment {
      background: linear-gradient(135deg, #ede9fe, #f5f3ff);
    }
  `]
})
export class NotificationDetailDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<NotificationDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Notification
  ) {}

  typeLabel(type: string): string {
    return formatNotificationTypeLabel(type);
  }

  typeIcon(type: string): string {
    return notificationTypeIcon(type);
  }

  accentClass(type: string): string {
    return notificationAccentClass(type);
  }

  formatMessage(message: string): string {
    return emphasizeQuotedText(message);
  }
}

function formatNotificationTypeLabel(type: string): string {
  return type.replaceAll('_', ' ');
}

function notificationTypeIcon(type: string): string {
  switch (type) {
    case 'ASSIGNMENT':
      return 'assignment_ind';
    case 'MENTION':
      return 'alternate_email';
    case 'DUE_DATE':
      return 'schedule';
    case 'CARD_MOVED':
      return 'swap_horiz';
    case 'COMMENT_REPLY':
      return 'chat_bubble_outline';
    default:
      return 'campaign';
  }
}

function notificationAccentClass(type: string): string {
  switch (type) {
    case 'ASSIGNMENT':
      return 'accent-assignment';
    case 'MENTION':
      return 'accent-mention';
    case 'DUE_DATE':
      return 'accent-due';
    case 'CARD_MOVED':
      return 'accent-moved';
    case 'COMMENT_REPLY':
      return 'accent-comment';
    default:
      return 'accent-broadcast';
  }
}

function emphasizeQuotedText(message: string): string {
  const escaped = escapeHtml(message ?? '');
  return escaped.replaceAll(/&quot;([^&]+)&quot;/g, '<strong class="message-entity">&quot;$1&quot;</strong>');
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
