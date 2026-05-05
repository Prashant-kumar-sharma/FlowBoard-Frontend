import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { AdminService, BoardAuditEvent, CardAuditEvent, WorkspaceAuditEvent } from '../../../core/services/admin.service';

type AuditItem = {
  source: 'WORKSPACE' | 'BOARD' | 'CARD';
  action: string;
  actorId: number;
  entityId: string;
  details: string;
  createdAt: string;
};

import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="text-xs uppercase tracking-[0.22em] text-slate-400">Platform Admin</p>
          <h1 class="text-3xl font-bold text-white">Audit Logs</h1>
          <p class="mt-1 text-sm text-slate-400">Cross-service activity feed for significant platform actions.</p>
        </div>
        <a routerLink="/admin" mat-flat-button color="primary" class="!rounded-xl">Back to Admin</a>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div *ngFor="let item of auditItems; let last = last" class="px-5 py-4" [class.border-b]="!last">
          <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <span class="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">{{ item.source }}</span>
                <span class="text-sm font-semibold text-slate-900">{{ item.action }}</span>
              </div>
              <div class="mt-2 text-sm text-slate-600">{{ item.details }}</div>
            </div>
            <div class="text-sm text-slate-500">
              Actor #{{ item.actorId }} · {{ item.entityId }} · {{ item.createdAt | date:'medium' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AuditLogsComponent implements OnInit {
  auditItems: AuditItem[] = [];

  constructor(private readonly adminService: AdminService) {}

  ngOnInit(): void {
    forkJoin({
      workspace: this.adminService.getWorkspaceAudit(),
      board: this.adminService.getBoardAudit(),
      card: this.adminService.getCardAudit()
    }).subscribe({
      next: ({ workspace, board, card }) => {
        this.auditItems = [
          ...workspace.map(event => this.fromWorkspace(event)),
          ...board.map(event => this.fromBoard(event)),
          ...card.map(event => this.fromCard(event)),
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    });
  }

  private fromWorkspace(event: WorkspaceAuditEvent): AuditItem {
    return {
      source: 'WORKSPACE',
      action: event.action,
      actorId: event.actorId,
      entityId: `Workspace #${event.workspaceId}`,
      details: event.details || `${event.targetType || 'WORKSPACE'} ${event.targetId || ''}`.trim(),
      createdAt: event.createdAt
    };
  }

  private fromBoard(event: BoardAuditEvent): AuditItem {
    return {
      source: 'BOARD',
      action: event.action,
      actorId: event.actorId,
      entityId: `Board #${event.boardId}`,
      details: event.details || `${event.targetType || 'BOARD'} ${event.targetId || ''}`.trim(),
      createdAt: event.createdAt
    };
  }

  private fromCard(event: CardAuditEvent): AuditItem {
    return {
      source: 'CARD',
      action: event.action,
      actorId: event.actorId,
      entityId: `Card #${event.cardId}`,
      details: [event.fieldName, event.oldValue, event.newValue].filter(Boolean).join(' -> ') || 'Card activity',
      createdAt: event.createdAt
    };
  }
}
