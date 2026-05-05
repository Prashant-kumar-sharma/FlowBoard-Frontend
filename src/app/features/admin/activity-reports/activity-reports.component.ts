import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AdminService, BoardAuditEvent, CardAuditEvent, WorkspaceAuditEvent } from '../../../core/services/admin.service';
import { User } from '../../../core/models/user.model';
import { Workspace } from '../../../core/models/workspace.model';
import { Board } from '../../../core/models/board.model';
import { Card } from '../../../core/models/card.model';

import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-activity-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatButtonModule],
  template: `
    <div class="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="text-xs uppercase tracking-[0.22em] text-slate-400">Platform Admin</p>
          <h1 class="text-3xl font-bold text-white">Activity Reports</h1>
          <p class="mt-1 text-sm text-slate-400">Generate exportable activity reports by workspace or user.</p>
        </div>
        <a routerLink="/admin" mat-flat-button color="primary" class="!rounded-xl">Back to Admin</a>
      </div>

      <div class="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-3">
        <label class="grid gap-2 text-sm text-slate-600">
          Scope
          <select [(ngModel)]="scope" class="rounded-xl border border-slate-300 px-3 py-2">
            <option value="workspace">Workspace</option>
            <option value="user">User</option>
          </select>
        </label>

        <label *ngIf="scope === 'workspace'" class="grid gap-2 text-sm text-slate-600">
          Workspace
          <select [(ngModel)]="selectedWorkspaceId" class="rounded-xl border border-slate-300 px-3 py-2">
            <option *ngFor="let workspace of workspaces" [ngValue]="workspace.id">{{ workspace.name }}</option>
          </select>
        </label>

        <label *ngIf="scope === 'user'" class="grid gap-2 text-sm text-slate-600">
          User
          <select [(ngModel)]="selectedUserId" class="rounded-xl border border-slate-300 px-3 py-2">
            <option *ngFor="let user of users" [ngValue]="user.id">{{ user.fullName }}</option>
          </select>
        </label>

        <button class="self-end rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white" (click)="exportCsv()">
          Export CSV
        </button>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-sm text-slate-500">
        Export includes relevant workspace audits, board audits, and card activity rows for the selected scope.
      </div>
    </div>
  `
})
export class ActivityReportsComponent implements OnInit {
  scope: 'workspace' | 'user' = 'workspace';
  selectedWorkspaceId: number | null = null;
  selectedUserId: number | null = null;

  users: User[] = [];
  workspaces: Workspace[] = [];
  boards: Board[] = [];
  cards: Card[] = [];
  workspaceAudit: WorkspaceAuditEvent[] = [];
  boardAudit: BoardAuditEvent[] = [];
  cardAudit: CardAuditEvent[] = [];

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    forkJoin({
      users: this.adminService.getUsers(),
      workspaces: this.adminService.getAllWorkspaces(),
      boards: this.adminService.getAllBoards(),
      cards: this.adminService.getAllCards(),
      workspaceAudit: this.adminService.getWorkspaceAudit(),
      boardAudit: this.adminService.getBoardAudit(),
      cardAudit: this.adminService.getCardAudit()
    }).subscribe({
      next: ({ users, workspaces, boards, cards, workspaceAudit, boardAudit, cardAudit }) => {
        this.users = users;
        this.workspaces = workspaces;
        this.boards = boards;
        this.cards = cards;
        this.workspaceAudit = workspaceAudit;
        this.boardAudit = boardAudit;
        this.cardAudit = cardAudit;
        this.selectedWorkspaceId = workspaces[0]?.id ?? null;
        this.selectedUserId = users[0]?.id ?? null;
      }
    });
  }

  exportCsv(): void {
    const rows = this.scope === 'workspace'
      ? this.buildWorkspaceRows()
      : this.buildUserRows();

    const csv = [
      ['source', 'action', 'actorId', 'entity', 'details', 'createdAt'],
      ...rows
    ].map(columns => columns.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = this.scope === 'workspace'
      ? `workspace-report-${this.selectedWorkspaceId}.csv`
      : `user-report-${this.selectedUserId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private buildWorkspaceRows(): string[][] {
    const workspaceId = this.selectedWorkspaceId;
    if (!workspaceId) {
      return [];
    }

    return [
      ...this.workspaceAudit
        .filter(event => event.workspaceId === workspaceId)
        .map(event => ['WORKSPACE', event.action, String(event.actorId), `Workspace #${event.workspaceId}`, event.details || '', event.createdAt]),
      ...this.boardAudit
        .filter(event => this.belongsToWorkspaceBoard(event.boardId, workspaceId))
        .map(event => ['BOARD', event.action, String(event.actorId), `Board #${event.boardId}`, event.details || '', event.createdAt]),
      ...this.cardAudit
        .filter(event => this.belongsToWorkspaceCard(event.cardId, workspaceId))
        .map(event => ['CARD', event.action, String(event.actorId), `Card #${event.cardId}`, [event.fieldName, event.oldValue, event.newValue].filter(Boolean).join(' -> '), event.createdAt]),
    ];
  }

  private buildUserRows(): string[][] {
    const userId = this.selectedUserId;
    if (!userId) {
      return [];
    }

    return [
      ...this.workspaceAudit
        .filter(event => event.actorId === userId)
        .map(event => ['WORKSPACE', event.action, String(event.actorId), `Workspace #${event.workspaceId}`, event.details || '', event.createdAt]),
      ...this.boardAudit
        .filter(event => event.actorId === userId)
        .map(event => ['BOARD', event.action, String(event.actorId), `Board #${event.boardId}`, event.details || '', event.createdAt]),
      ...this.cardAudit
        .filter(event => event.actorId === userId)
        .map(event => ['CARD', event.action, String(event.actorId), `Card #${event.cardId}`, [event.fieldName, event.oldValue, event.newValue].filter(Boolean).join(' -> '), event.createdAt]),
    ];
  }

  private belongsToWorkspaceBoard(boardId: number, workspaceId: number): boolean {
    return this.boards.some(board => board.id === boardId && board.workspaceId === workspaceId);
  }

  private belongsToWorkspaceCard(cardId: number, workspaceId: number): boolean {
    const card = this.cards.find(existing => existing.id === cardId);
    if (!card) {
      return false;
    }

    return this.belongsToWorkspaceBoard(card.boardId, workspaceId);
  }
}
