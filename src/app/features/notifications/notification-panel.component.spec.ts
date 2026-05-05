import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { NotificationPanelComponent, NotificationDetailDialogComponent } from './notification-panel.component';
import { NotificationService } from '../../core/services/notification.service';
import { Notification } from '../../core/models/notification.model';

describe('NotificationPanelComponent', () => {
  let fixture: ComponentFixture<NotificationPanelComponent>;
  let component: NotificationPanelComponent;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let dialog: jasmine.SpyObj<MatDialog>;

  const notifications: Notification[] = [
    {
      id: 1,
      recipientId: 3,
      type: 'MENTION',
      title: 'New Mention',
      message: 'Alex mentioned you in "Marketing plan".',
      isRead: false,
      createdAt: '2026-05-04T00:00:00Z'
    },
    {
      id: 2,
      recipientId: 3,
      type: 'BROADCAST',
      title: 'Platform Update',
      message: 'Maintenance starts tonight.',
      isRead: true,
      createdAt: '2026-05-03T00:00:00Z'
    }
  ];

  beforeEach(async () => {
    notificationService = jasmine.createSpyObj<NotificationService>(
      'NotificationService',
      ['getAll', 'markAllRead', 'markRead', 'deleteRead']
    );
    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);

    notificationService.getAll.and.callFake(() => of(notifications.map((notification) => ({ ...notification }))));
    notificationService.markAllRead.and.returnValue(of(void 0));
    notificationService.markRead.and.returnValue(of(void 0));
    notificationService.deleteRead.and.returnValue(of(void 0));

    await TestBed.configureTestingModule({
      imports: [NotificationPanelComponent],
      providers: [
        { provide: NotificationService, useValue: notificationService },
        { provide: MatDialog, useValue: dialog }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads notifications on init', () => {
    expect(notificationService.getAll).toHaveBeenCalled();
    expect(component.notifications).toEqual(notifications);
    expect(component.unreadCount).toBe(1);
    expect(component.hasReadNotifications).toBeTrue();
  });

  it('marks all notifications as read in local state', () => {
    component.markAllRead();

    expect(notificationService.markAllRead).toHaveBeenCalled();
    expect(component.notifications.every((notification) => notification.isRead)).toBeTrue();
  });

  it('marks an unread notification as read and opens the detail dialog', () => {
    const target = component.notifications[0];

    component.handleClick(target);

    expect(notificationService.markRead).toHaveBeenCalledWith(1);
    expect(target.isRead).toBeTrue();
    expect(dialog.open).toHaveBeenCalledWith(NotificationDetailDialogComponent, jasmine.objectContaining({
      data: target
    }));
  });

  it('opens the detail dialog for already read notifications without calling markRead', () => {
    const target = component.notifications[1];

    component.handleClick(target);

    expect(notificationService.markRead).not.toHaveBeenCalled();
    expect(dialog.open).toHaveBeenCalled();
  });

  it('deletes read notifications from local state', () => {
    component.deleteRead();

    expect(notificationService.deleteRead).toHaveBeenCalled();
    expect(component.notifications).toEqual([notifications[0]]);
  });

  it('returns labels, icons, classes, and formatted message text', () => {
    expect(component.typeLabel('COMMENT_REPLY')).toBe('COMMENT REPLY');
    expect(component.typeIcon('ASSIGNMENT')).toBe('assignment_ind');
    expect(component.typeIcon('MENTION')).toBe('alternate_email');
    expect(component.typeIcon('DUE_DATE')).toBe('schedule');
    expect(component.typeIcon('CARD_MOVED')).toBe('swap_horiz');
    expect(component.typeIcon('COMMENT_REPLY')).toBe('chat_bubble_outline');
    expect(component.typeIcon('UNKNOWN')).toBe('campaign');
    expect(component.accentClass('ASSIGNMENT')).toBe('accent-assignment');
    expect(component.accentClass('MENTION')).toBe('accent-mention');
    expect(component.accentClass('DUE_DATE')).toBe('accent-due');
    expect(component.accentClass('CARD_MOVED')).toBe('accent-moved');
    expect(component.accentClass('COMMENT_REPLY')).toBe('accent-comment');
    expect(component.accentClass('UNKNOWN')).toBe('accent-broadcast');
    expect(component.typeClass('CARD_MOVED')).toEqual(jasmine.objectContaining({
      'bg-green-100 text-green-700': true
    }));
    expect(component.typeClass('ASSIGNMENT')).toEqual(jasmine.objectContaining({
      'bg-blue-100 text-blue-700': true
    }));
    expect(component.typeClass('MENTION')).toEqual(jasmine.objectContaining({
      'bg-yellow-100 text-yellow-700': true
    }));
    expect(component.typeClass('DUE_DATE')).toEqual(jasmine.objectContaining({
      'bg-red-100 text-red-700': true
    }));
    expect(component.typeClass('BROADCAST')).toEqual(jasmine.objectContaining({
      'bg-gray-100 text-gray-600': true
    }));
    expect(component.typeClass('COMMENT_REPLY')).toEqual(jasmine.objectContaining({
      'bg-violet-100 text-violet-700': true
    }));
    expect(component.formatMessage('See "Alpha" <script>bad</script>')).toContain('<strong class="message-entity">&quot;Alpha&quot;</strong>');
    expect(component.formatMessage('See "Alpha" <script>bad</script>')).not.toContain('<script>');
  });
});

describe('NotificationDetailDialogComponent', () => {
  const data: Notification = {
    id: 3,
    recipientId: 4,
    type: 'ASSIGNMENT',
    title: 'Assigned',
    message: 'You have been assigned to "Release prep".',
    isRead: false,
    createdAt: '2026-05-04T00:00:00Z'
  };

  let component: NotificationDetailDialogComponent;
  let dialogRef: jasmine.SpyObj<any>;

  beforeEach(() => {
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    component = new NotificationDetailDialogComponent(dialogRef, data);
  });

  it('formats detail metadata consistently', () => {
    expect(component.typeLabel('CARD_MOVED')).toBe('CARD MOVED');
    expect(component.typeIcon('ASSIGNMENT')).toBe('assignment_ind');
    expect(component.typeIcon('MENTION')).toBe('alternate_email');
    expect(component.typeIcon('DUE_DATE')).toBe('schedule');
    expect(component.typeIcon('CARD_MOVED')).toBe('swap_horiz');
    expect(component.typeIcon('COMMENT_REPLY')).toBe('chat_bubble_outline');
    expect(component.typeIcon('UNKNOWN')).toBe('campaign');
    expect(component.accentClass('ASSIGNMENT')).toBe('accent-assignment');
    expect(component.accentClass('MENTION')).toBe('accent-mention');
    expect(component.accentClass('DUE_DATE')).toBe('accent-due');
    expect(component.accentClass('CARD_MOVED')).toBe('accent-moved');
    expect(component.accentClass('COMMENT_REPLY')).toBe('accent-comment');
    expect(component.accentClass('UNKNOWN')).toBe('accent-broadcast');
    expect(component.formatMessage(data.message)).toContain('&quot;Release prep&quot;');
    expect(component.formatMessage(`Quote "Alpha" and 'beta' <tag>`)).toContain('&#39;beta&#39;');
    expect(component.formatMessage(`Quote "Alpha" and 'beta' <tag>`)).toContain('&lt;tag&gt;');
  });
});
