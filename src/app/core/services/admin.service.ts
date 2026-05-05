import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';
import { Workspace } from '../models/workspace.model';
import { Board } from '../models/board.model';
import { Card } from '../models/card.model';

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  platformAdmins: number;
  totalWorkspaces?: number;
  totalBoards?: number;
  totalCards?: number;
  activeTeams?: number;
  overdueCards?: number;
}

export interface WorkspaceAuditEvent {
  id: number;
  workspaceId: number;
  actorId: number;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: string;
  createdAt: string;
}

export interface BoardAuditEvent {
  id: number;
  boardId: number;
  actorId: number;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: string;
  createdAt: string;
}

export interface CardAuditEvent {
  id: number;
  cardId: number;
  actorId: number;
  action: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
}

export interface BroadcastRequest {
  recipientIds: number[];
  title: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly adminBase = `${environment.services.auth}/admin`;
  private readonly workspaceBase = environment.services.workspace;
  private readonly boardBase = environment.services.board;
  private readonly cardBase = environment.services.card;
  private readonly notificationBase = environment.services.notification;

  constructor(private http: HttpClient) {}

  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.adminBase}/stats`);
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.adminBase}/users`);
  }

  changeRole(userId: number, role: User['role']): Observable<User> {
    return this.http.patch<User>(`${this.adminBase}/users/${userId}/role`, { role });
  }

  suspendUser(userId: number): Observable<void> {
    return this.http.patch<void>(`${this.adminBase}/users/${userId}/suspend`, {});
  }

  restoreUser(userId: number): Observable<void> {
    return this.http.patch<void>(`${this.adminBase}/users/${userId}/restore`, {});
  }

  deleteUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.adminBase}/users/${userId}`);
  }

  getAllWorkspaces(): Observable<Workspace[]> {
    return this.http.get<Workspace[]>(`${this.workspaceBase}/workspaces/admin/all`);
  }

  deleteWorkspace(workspaceId: number): Observable<void> {
    return this.http.delete<void>(`${this.workspaceBase}/workspaces/admin/${workspaceId}`);
  }

  getWorkspaceAudit(): Observable<WorkspaceAuditEvent[]> {
    return this.http.get<WorkspaceAuditEvent[]>(`${this.workspaceBase}/workspaces/admin/audit`);
  }

  getAllBoards(): Observable<Board[]> {
    return this.http.get<Board[]>(`${this.boardBase}/boards/admin/all`);
  }

  closeBoard(boardId: number): Observable<void> {
    return this.http.patch<void>(`${this.boardBase}/boards/admin/${boardId}/close`, {});
  }

  deleteBoard(boardId: number): Observable<void> {
    return this.http.delete<void>(`${this.boardBase}/boards/admin/${boardId}`);
  }

  getBoardAudit(): Observable<BoardAuditEvent[]> {
    return this.http.get<BoardAuditEvent[]>(`${this.boardBase}/boards/admin/audit`);
  }

  getAllCards(): Observable<Card[]> {
    return this.http.get<Card[]>(`${this.cardBase}/cards/admin/all`);
  }

  getOverdueCards(): Observable<Card[]> {
    return this.http.get<Card[]>(`${this.cardBase}/cards/overdue`);
  }

  getCardAudit(): Observable<CardAuditEvent[]> {
    return this.http.get<CardAuditEvent[]>(`${this.cardBase}/cards/admin/activity`);
  }

  broadcast(req: BroadcastRequest): Observable<void> {
    return this.http.post<void>(`${this.notificationBase}/notifications/broadcast`, req);
  }
}
