export type NotificationType = 'ASSIGNMENT' | 'MENTION' | 'DUE_DATE' | 'COMMENT_REPLY' | 'CARD_MOVED' | 'BROADCAST';

export interface Notification {
  id: number;
  recipientId: number;
  actorId?: number;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: number;
  relatedType?: string;
  deepLinkUrl?: string;
  isRead: boolean;
  createdAt: string;
}