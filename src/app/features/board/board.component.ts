import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin, of, Subject, takeUntil } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as BoardActions from '../../store/board/board.actions';
import { selectAllCards, selectBoard, selectLists, selectLoading } from '../../store/board/board.selectors';
import { Board, BoardMember } from '../../core/models/board.model';
import { Card, TaskList } from '../../core/models/card.model';
import { CardService } from '../../core/services/card.service';
import { ListService } from '../../core/services/list.service';
import { CreateListDialogComponent, CreateListDialogResult } from './create-list-dialog.component';
import { CreateCardDialogComponent } from './create-card-dialog.component';
import { CardDetailComponent } from './card-detail/card-detail.component';
import { BoardService } from '../../core/services/board.service';
import { CreateBoardDialogComponent } from './create-board-dialog.component';
import { AuthService } from '../../core/auth/auth.service';
import { User } from '../../core/models/user.model';
import { BoardInviteDialogComponent, BoardInviteDialogResult } from './board-invite-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { PromptDialogComponent } from '../../shared/components/prompt-dialog/prompt-dialog.component';
import { MoveListDialogComponent } from './move-list-dialog.component';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, RouterLink, DragDropModule, MatButtonModule, MatIconModule],
  template: `
    <div class="board-shell m-1 flex min-h-[calc(100vh-0.5rem)] flex-col overflow-y-auto overflow-x-hidden rounded-[28px] border border-slate-950/20 shadow-[0_28px_70px_rgba(15,23,42,0.28)]" [style.background]="currentBoard?.background || '#0f172a'">
      <div class="board-overlay"></div>

      <section class="relative border-b border-white/10 bg-slate-950/18 backdrop-blur-xl">
        <div class="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="min-w-0">
              <div class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/65">
                <a routerLink="/dashboard" class="transition hover:text-white">Workspaces</a>
                <span>/</span>
                <a
                  *ngIf="currentBoard?.workspaceId"
                  [routerLink]="['/workspace', currentBoard?.workspaceId]"
                  class="transition hover:text-white"
                >
                  Workspace
                </a>
                <span *ngIf="currentBoard?.workspaceId">/</span>
                <span class="text-white/88">Board</span>
              </div>

              <div class="flex items-start gap-4">
                <div class="board-mark">
                  {{ getBoardInitials() }}
                </div>
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-3">
                    <h1 class="truncate text-3xl font-semibold text-white sm:text-4xl">{{ currentBoard?.name }}</h1>
                    <span *ngIf="currentBoard?.isClosed" class="rounded-full border border-amber-200/30 bg-amber-400/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-100">
                      Closed
                    </span>
                  </div>
                  <p class="mt-2 max-w-2xl text-sm leading-7 text-slate-200/84 sm:text-base">
                    {{ currentBoard?.description || 'A refined execution surface for moving work across lists with more clarity and less visual noise.' }}
                  </p>
                </div>
              </div>
            </div>

            <div class="flex flex-wrap gap-3" *ngIf="isLoggedIn">
              <button mat-flat-button color="primary" class="board-primary-button" type="button" (click)="addList()" [disabled]="currentBoard?.isClosed">
                <mat-icon>add</mat-icon>
                Add List
              </button>
              <button
                *ngIf="canManageBoard && !currentBoard?.isClosed"
                mat-stroked-button
                type="button"
                class="board-secondary-button"
                (click)="openBoardInviteDialog()"
              >
                <mat-icon>person_add</mat-icon>
                Add Member
              </button>
              <button
                *ngIf="canManageBoard && !currentBoard?.isClosed"
                mat-stroked-button
                type="button"
                class="board-danger-button"
                (click)="closeBoard()"
              >
                <mat-icon>lock</mat-icon>
                Close Board
              </button>
              <button mat-stroked-button type="button" class="board-secondary-button" (click)="editBoard()">
                <mat-icon>edit</mat-icon>
                Edit Board
              </button>
              <a
                *ngIf="currentBoard?.workspaceId"
                mat-stroked-button
                [routerLink]="['/workspace', currentBoard?.workspaceId]"
                class="board-secondary-button"
              >
                <mat-icon>arrow_back</mat-icon>
                Back to Workspace
              </a>
              <a mat-stroked-button routerLink="/dashboard" class="board-secondary-button">
                <mat-icon>apps</mat-icon>
                All Workspaces
              </a>
            </div>

            <div class="flex flex-wrap gap-4" *ngIf="!isLoggedIn">
              <a mat-flat-button color="primary" routerLink="/auth/register" class="guest-cta-primary">
                <mat-icon>rocket_launch</mat-icon>
                <span>Join to Collaborate</span>
              </a>
              <a
                *ngIf="currentBoard?.workspaceId"
                mat-stroked-button
                [routerLink]="['/workspace', currentBoard?.workspaceId]"
                class="guest-cta-secondary"
              >
                <mat-icon>arrow_back</mat-icon>
                <span>Back to Workspace</span>
              </a>
            </div>
          </div>

          <div class="grid gap-3 sm:grid-cols-3 lg:max-w-4xl">
            <article class="board-metric">
              <p class="board-metric-label">Lists</p>
              <p class="board-metric-value">{{ lists.length }}</p>
              <p class="board-metric-copy">Columns shaping the flow of work across this board.</p>
            </article>
            <article class="board-metric">
              <p class="board-metric-label">Cards</p>
              <p class="board-metric-value">{{ totalCards }}</p>
              <p class="board-metric-copy">Active tasks visible across all lists and swimlanes.</p>
            </article>
            <article class="board-metric">
              <p class="board-metric-label">Overdue</p>
              <p class="board-metric-value">{{ overdueCards }}</p>
              <p class="board-metric-copy">Items needing attention so the board stays trustworthy.</p>
            </article>
          </div>

	          <div class="board-members-panel" *ngIf="isLoggedIn">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p class="board-members-eyebrow">Board Members</p>
                <p class="board-members-copy">
                  {{ boardMembers.length }} people can access this board.
                </p>
              </div>
              <button
                *ngIf="canManageBoard && !currentBoard?.isClosed"
                mat-stroked-button
                type="button"
                class="board-secondary-button"
                (click)="openBoardInviteDialog()"
              >
                <mat-icon>group_add</mat-icon>
                Invite to Board
              </button>
            </div>

	            <div class="mt-4 flex flex-wrap gap-3">
              <article *ngFor="let member of boardMembers; trackBy: trackByBoardMember" class="board-member-card">
                <div class="board-member-avatar">{{ getBoardMemberInitials(member.userId) }}</div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-semibold text-slate-900">{{ getBoardMemberLabel(member.userId) }}</p>
                  <p class="text-xs uppercase tracking-[0.16em] text-slate-500">{{ member.role }}</p>
                </div>
                <button
                  *ngIf="canManageBoard && canChangeBoardMemberRole(member)"
                  mat-stroked-button
                  type="button"
                  class="board-member-role"
                  (click)="changeBoardMemberRole(member)"
                >
                  {{ member.role === 'ADMIN' ? 'Set as Member' : 'Make Admin' }}
                </button>
                <button
                  *ngIf="canManageBoard && canRemoveBoardMember(member)"
                  mat-stroked-button
                  type="button"
                  class="board-member-remove"
                  (click)="removeBoardMember(member)"
                >
                  Remove
                </button>
              </article>
	            </div>
	          </div>

	          <div *ngIf="archivedLists.length && isLoggedIn" class="board-archived-panel">
	            <div class="flex flex-wrap items-start justify-between gap-4">
	              <div>
	                <p class="board-members-eyebrow">Archived Lists</p>
	                <p class="board-members-copy">{{ archivedLists.length }} archived list{{ archivedLists.length === 1 ? '' : 's' }} saved for later.</p>
	              </div>
	            </div>

	            <div class="mt-4 flex flex-wrap gap-3">
	              <article *ngFor="let archived of archivedLists; trackBy: trackByArchivedList" class="archived-list-card">
	                <div class="min-w-0 flex-1">
	                  <p class="truncate text-sm font-semibold text-slate-900">{{ archived.name }}</p>
	                  <p class="text-xs uppercase tracking-[0.16em] text-slate-500">Archived</p>
	                </div>
	                <button mat-stroked-button type="button" class="archived-list-action" (click)="restoreList(archived)">
	                  Restore
	                </button>
	                <button mat-stroked-button type="button" class="archived-list-action" (click)="moveList(archived)">
	                  Move
	                </button>
	                <button mat-stroked-button type="button" class="archived-list-delete" (click)="deleteList(archived)">
	                  Delete
	                </button>
	              </article>
	            </div>
	          </div>
	        </div>
	      </section>

      <section class="relative flex-1 overflow-x-auto overflow-y-hidden min-h-[600px]">
        <div
          class="board-lane mx-auto flex h-full min-w-max items-start gap-5 px-4 py-5 sm:px-6 lg:px-8"
          cdkDropList
          cdkDropListOrientation="horizontal"
          [cdkDropListData]="lists"
          [cdkDropListDisabled]="!isLoggedIn"
          (cdkDropListDropped)="dropList($event)"
        >
          <article
            *ngFor="let list of lists; trackBy: trackByList"
            class="kanban-list flex max-h-full w-[22rem] flex-shrink-0 flex-col rounded-[28px]"
            cdkDrag
          >
            <div class="kanban-list-top px-4 py-4">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="list-accent" [style.background]="list.color || '#38bdf8'"></span>
                    <p class="text-[11px] uppercase tracking-[0.24em] text-slate-500">List</p>
                  </div>
                  <h2 class="mt-3 text-lg font-semibold text-slate-900">{{ list.name }}</h2>
                </div>

	                <div class="flex flex-wrap items-center justify-end gap-2">
	                  <button
	                    mat-stroked-button
	                    type="button"
	                    class="list-action-button"
	                    (click)="editList(list)"
	                    *ngIf="isLoggedIn"
	                    [disabled]="currentBoard?.isClosed"
	                  >
	                    <mat-icon>edit</mat-icon>
	                  </button>
	                  <button
	                    mat-stroked-button
	                    type="button"
	                    class="list-action-button"
	                    (click)="moveList(list)"
	                    *ngIf="isLoggedIn"
	                    [disabled]="currentBoard?.isClosed || workspaceBoards.length === 0"
	                  >
	                    <mat-icon>swap_horiz</mat-icon>
	                  </button>
	                  <button
	                    mat-stroked-button
	                    type="button"
	                    class="list-action-button"
	                    (click)="archiveList(list)"
	                    *ngIf="isLoggedIn"
	                    [disabled]="currentBoard?.isClosed"
	                  >
	                    <mat-icon>archive</mat-icon>
	                  </button>
	                  <button
	                    mat-stroked-button
	                    type="button"
	                    class="list-delete-button"
	                    (click)="deleteList(list)"
	                    *ngIf="isLoggedIn"
	                  >
	                    <mat-icon>delete</mat-icon>
	                  </button>
	                </div>
	              </div>

              <div class="mt-4 flex items-center justify-between gap-3">
                <div class="list-stat-chip">
                  <mat-icon>inventory_2</mat-icon>
                  {{ getCards(list.id).length }} cards
                </div>
                <div class="list-stat-chip" *ngIf="getOverdueCount(list.id) > 0">
                  <mat-icon>schedule</mat-icon>
                  {{ getOverdueCount(list.id) }} overdue
                </div>
              </div>
            </div>

            <div
              class="list-card-stack flex-1 overflow-y-auto px-3 pb-3"
              cdkDropList
              [id]="'list-' + list.id"
              [cdkDropListData]="getCards(list.id)"
              [cdkDropListConnectedTo]="getConnectedLists()"
              [cdkDropListDisabled]="!isLoggedIn"
              (cdkDropListDropped)="dropCard($event, list.id)"
            >
              <article
                *ngFor="let card of getCards(list.id); trackBy: trackByCard"
                cdkDrag
                class="task-card mb-3 cursor-pointer rounded-[22px] p-4 shadow-[0_18px_35px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_22px_45px_rgba(15,23,42,0.12)]"
                (click)="openCard(card)"
              >
                <div class="task-card-cover" *ngIf="card.coverColor !== '#FFFFFF'" [style.background]="card.coverColor"></div>

                <div class="flex flex-wrap items-center gap-2">
                  <span class="task-priority" [ngClass]="priorityClass(card.priority)">
                    {{ formatPriority(card.priority) }}
                  </span>
                  <span *ngIf="card.isOverdue" class="task-priority task-overdue">Overdue</span>
                  <button *ngIf="isLoggedIn" type="button" class="card-edit-button" (click)="editCard(card, $event)">
                    <mat-icon>edit</mat-icon>
                    Edit
                  </button>
                </div>

                <h3 class="mt-3 text-base font-semibold leading-6 text-slate-900">{{ card.title }}</h3>
                <p class="mt-2 text-sm leading-6 text-slate-600">
                  {{ getCardSummary(card) }}
                </p>

                <div class="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span class="task-meta-chip">
                    <mat-icon>flag</mat-icon>
                    {{ formatStatus(card.status) }}
                  </span>
                  <span class="task-meta-chip" *ngIf="card.dueDate">
                    <mat-icon>calendar_today</mat-icon>
                    Due {{ card.dueDate | date:'MMM d' }}
                  </span>
                </div>
              </article>
            </div>

            <button *ngIf="isLoggedIn" class="add-card-button" (click)="addCard(list.id)" [disabled]="currentBoard?.isClosed">
              <mat-icon>add</mat-icon>
              Add card
            </button>
          </article>

          <button *ngIf="isLoggedIn" class="add-list-panel" (click)="addList()" [disabled]="currentBoard?.isClosed">
            <span class="add-list-badge">
              <mat-icon>add</mat-icon>
            </span>
            <span>
              <span class="block text-lg font-semibold text-white">Add another list</span>
              <span class="mt-2 block max-w-[14rem] text-sm leading-6 text-slate-200/80">
                Create a new stage for intake, delivery, QA, or whatever this board needs next.
              </span>
            </span>
          </button>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .board-shell {
      position: relative;
      background-size: cover;
      background-position: center;
      isolation: isolate;
      overflow: hidden;
    }

    .board-overlay {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at top left, rgba(255,255,255,0.12), transparent 24rem),
        linear-gradient(180deg, rgba(15,23,42,0.34), rgba(15,23,42,0.22) 22%, rgba(15,23,42,0.12) 100%);
      pointer-events: none;
    }

    .board-mark {
      display: flex;
      height: 4rem;
      width: 4rem;
      align-items: center;
      justify-content: center;
      border-radius: 1.3rem;
      border: 1px solid rgba(255,255,255,0.16);
      background: rgba(255,255,255,0.12);
      color: white;
      font-size: 1.3rem;
      font-weight: 700;
      text-transform: uppercase;
      box-shadow: 0 16px 34px rgba(15,23,42,0.2);
    }

    .board-metric {
      border: 1px solid rgba(255,255,255,0.14);
      border-radius: 1.5rem;
      background: rgba(255,255,255,0.08);
      padding: 1rem 1.15rem;
      backdrop-filter: blur(14px);
    }

    .board-metric-label {
      margin: 0;
      font-size: 0.7rem;
      letter-spacing: 0.24em;
      text-transform: uppercase;
      color: rgba(224, 242, 254, 0.72);
    }

    .board-metric-value {
      margin: 0.7rem 0 0;
      font-size: 2rem;
      font-weight: 700;
      line-height: 1;
      color: white;
    }

    .board-metric-copy {
      margin: 0.7rem 0 0;
      font-size: 0.9rem;
      line-height: 1.55;
      color: rgba(226, 232, 240, 0.8);
    }

    .board-primary-button,
    .board-secondary-button,
    .board-danger-button,
    .list-delete-button {
      border-radius: 9999px;
    }

    .board-primary-button {
      box-shadow: 0 18px 35px rgba(2,132,199,0.24);
    }

    .board-secondary-button {
      border-color: rgba(255,255,255,0.2) !important;
      background: rgba(255,255,255,0.08) !important;
      color: white !important;
    }

    .board-danger-button {
      border-color: rgba(253,186,116,0.28) !important;
      background: rgba(120,53,15,0.18) !important;
      color: #ffedd5 !important;
    }

    .board-members-panel {
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 1.6rem;
      background: rgba(255,255,255,0.08);
      padding: 1rem 1.1rem;
      backdrop-filter: blur(14px);
    }

    .board-archived-panel {
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 1.6rem;
      background: rgba(255,255,255,0.08);
      padding: 1rem 1.1rem;
      backdrop-filter: blur(14px);
    }

    .board-members-eyebrow {
      margin: 0;
      font-size: 0.72rem;
      letter-spacing: 0.24em;
      text-transform: uppercase;
      color: rgba(224, 242, 254, 0.72);
    }

    .board-members-copy {
      margin: 0.5rem 0 0;
      font-size: 0.94rem;
      color: rgba(226, 232, 240, 0.86);
    }

    .board-member-card {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      min-width: 15rem;
      max-width: 100%;
      padding: 0.8rem 0.9rem;
      border-radius: 1.15rem;
      border: 1px solid rgba(255,255,255,0.14);
      background: rgba(255,255,255,0.12);
    }

    .board-member-avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 0.9rem;
      background: rgba(255,255,255,0.16);
      color: white;
      font-size: 0.82rem;
      font-weight: 700;
    }

    .board-member-remove {
      border-radius: 9999px;
      border-color: rgba(255,255,255,0.2) !important;
      color: white !important;
      background: rgba(15,23,42,0.12) !important;
    }

    .board-member-role {
      border-radius: 9999px;
      border-color: rgba(255,255,255,0.2) !important;
      color: white !important;
      background: rgba(255,255,255,0.08) !important;
    }

    .archived-list-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-width: 18rem;
      max-width: 100%;
      padding: 0.85rem 0.95rem;
      border-radius: 1.15rem;
      border: 1px solid rgba(255,255,255,0.14);
      background: rgba(255,255,255,0.12);
    }

    .archived-list-action,
    .archived-list-delete,
    .list-action-button {
      border-radius: 9999px;
    }

    .archived-list-action,
    .list-action-button {
      border-color: rgba(148,163,184,0.18) !important;
      color: #475569 !important;
      background: rgba(255,255,255,0.72) !important;
    }

    .archived-list-delete {
      border-color: rgba(248,113,113,0.24) !important;
      color: #b91c1c !important;
      background: rgba(255,255,255,0.82) !important;
    }

    .kanban-list {
      border: 1px solid rgba(255,255,255,0.16);
      border-radius: 1.8rem;
      background: rgba(248, 250, 252, 0.86);
      box-shadow: 0 24px 65px rgba(15,23,42,0.16);
      backdrop-filter: blur(16px);
      overflow: hidden;
    }

    .kanban-list-top {
      border-bottom: 1px solid rgba(148,163,184,0.12);
      background:
        linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.86));
    }

    .list-accent {
      width: 0.6rem;
      height: 0.6rem;
      border-radius: 9999px;
      box-shadow: 0 0 0 5px rgba(56,189,248,0.12);
    }

    .list-stat-chip,
    .task-meta-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.42rem;
      border-radius: 9999px;
      font-size: 0.76rem;
      font-weight: 700;
      line-height: 1;
    }

    .list-stat-chip {
      border: 1px solid rgba(148,163,184,0.16);
      background: rgba(255,255,255,0.72);
      color: #475569;
      padding: 0.65rem 0.78rem;
    }

    .list-stat-chip mat-icon,
    .task-meta-chip mat-icon {
      font-size: 0.95rem;
      width: 0.95rem;
      height: 0.95rem;
    }

    .list-card-stack {
      min-height: 8rem;
      border-radius: 0 0 1.8rem 1.8rem;
    }

    .task-card {
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(226,232,240,0.8);
      background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.96));
    }

    .task-card-cover {
      height: 0.45rem;
      border-radius: 9999px;
      margin: -0.35rem 0 0.9rem;
    }

    .task-priority {
      display: inline-flex;
      align-items: center;
      border-radius: 9999px;
      padding: 0.48rem 0.7rem;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .task-overdue {
      background: #fee2e2;
      color: #b91c1c;
    }

    .card-edit-button {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      border: 0;
      border-radius: 9999px;
      background: #e2e8f0;
      color: #334155;
      padding: 0.45rem 0.7rem;
      font-size: 0.72rem;
      font-weight: 700;
      cursor: pointer;
    }

    .task-meta-chip {
      background: #f1f5f9;
      color: #475569;
      padding: 0.55rem 0.72rem;
    }

    .add-card-button {
      display: flex;
      align-items: center;
      gap: 0.55rem;
      width: calc(100% - 1.5rem);
      margin: 0 0.75rem 0.75rem;
      border: 0;
      border-radius: 1.05rem;
      background: rgba(15,23,42,0.05);
      color: #475569;
      padding: 0.9rem 1rem;
      font-size: 0.95rem;
      font-weight: 700;
      transition: background 180ms ease, transform 180ms ease;
    }

    .add-card-button:hover,
    .add-list-panel:hover {
      transform: translateY(-2px);
    }

    .add-card-button:hover {
      background: rgba(15,23,42,0.08);
    }

    .add-list-panel {
      width: 22rem;
      flex-shrink: 0;
      border: 1px dashed rgba(255,255,255,0.28);
      border-radius: 1.75rem;
      background: rgba(15,23,42,0.18);
      color: white;
      padding: 1.4rem;
      text-align: left;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
      backdrop-filter: blur(12px);
      transition: transform 180ms ease, background 180ms ease, border-color 180ms ease;
    }

    .add-list-panel:hover {
      background: rgba(15,23,42,0.24);
      border-color: rgba(255,255,255,0.4);
    }

    .add-list-badge {
      display: inline-flex;
      height: 3rem;
      width: 3rem;
      align-items: center;
      justify-content: center;
      border-radius: 1rem;
      background: rgba(255,255,255,0.12);
      margin-bottom: 1rem;
    }

    .list-delete-button {
      min-width: 2.35rem;
      width: 2.35rem;
      height: 2.35rem;
      padding: 0 !important;
      border-color: rgba(148,163,184,0.18) !important;
      color: #475569 !important;
      background: rgba(255,255,255,0.72) !important;
    }

    .list-action-button {
      min-width: 2.9rem;
      width: 2.9rem;
      height: 2.35rem;
      padding: 0 !important;
    }

    .list-action-button .mat-icon,
    .list-delete-button .mat-icon {
      margin: 0;
      font-size: 1.05rem;
      width: 1.05rem;
      height: 1.05rem;
      line-height: 1.05rem;
    }

    .guest-cta-primary, .guest-cta-secondary {
      height: 3.2rem !important;
      padding: 0 1.6rem !important;
      border-radius: 9999px !important;
      font-weight: 600 !important;
      letter-spacing: 0.02em !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 0.75rem !important;
    }

    .guest-cta-primary {
      background: #ffffff !important;
      color: #0f172a !important;
      box-shadow: 0 12px 30px rgba(0,0,0,0.15) !important;
    }

    .guest-cta-secondary {
      border: 1px solid rgba(255,255,255,0.3) !important;
      background: rgba(255,255,255,0.1) !important;
      color: #ffffff !important;
      backdrop-filter: blur(8px) !important;
    }

    mat-icon {
      font-family: 'Material Icons' !important;
      font-feature-settings: 'liga' !important;
    }
  `]
})
export class BoardComponent implements OnInit, OnDestroy {
  board$ = this.store.select(selectBoard);
  lists$ = this.store.select(selectLists);
  loading$ = this.store.select(selectLoading);
  currentBoard: Board | null = null;
  boardMembers: BoardMember[] = [];
  lists: TaskList[] = [];
  archivedLists: TaskList[] = [];
  workspaceBoards: Board[] = [];
  cards: Card[] = [];
  cardsByList: Record<number, Card[]> = {};
  assigneeDirectory: Record<number, User> = {};
  boardMemberDirectory: Record<number, User> = {};
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private store: Store,
    private cardService: CardService,
    private listService: ListService,
    private boardService: BoardService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snack: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const boardId = +params['id'];
      this.store.dispatch(BoardActions.clearBoard());
      this.currentBoard = null;
      this.boardMembers = [];
      this.lists = [];
      this.archivedLists = [];
      this.workspaceBoards = [];
      this.cards = [];
      this.cardsByList = {};
      this.store.dispatch(BoardActions.loadBoard({ boardId }));
      this.loadArchivedLists(boardId);
    });
    this.store.select(selectLists).pipe(takeUntil(this.destroy$)).subscribe(l => this.lists = l);
    this.board$.pipe(takeUntil(this.destroy$)).subscribe(board => {
      this.currentBoard = board;
      this.boardMembers = board?.members ?? [];
      this.loadBoardMemberUsers(this.boardMembers);
      if (board?.workspaceId) {
        this.loadWorkspaceBoards(board.workspaceId, board.id);
      }
    });
    this.store.select(selectAllCards).pipe(takeUntil(this.destroy$)).subscribe(cards => {
      this.cards = cards.filter(card => !card.isArchived);
      this.loadAssigneeUsers(this.cards);
      this.cardsByList = this.cards.reduce<Record<number, Card[]>>((acc, card) => {
        if (!acc[card.listId]) {
          acc[card.listId] = [];
        }
        acc[card.listId].push(card);
        return acc;
      }, {});

      Object.keys(this.cardsByList).forEach(key => {
        this.cardsByList[+key] = this.cardsByList[+key].sort((a, b) => a.position - b.position);
      });
    });
  }

  getCards(listId: number): Card[] {
    return this.cardsByList[listId] ?? [];
  }

  getConnectedLists(): string[] {
    return this.lists.map(l => 'list-' + l.id);
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  dropCard(event: CdkDragDrop<Card[]>, targetListId: number): void {
    if (!this.isLoggedIn) return;
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data,
                        event.previousIndex, event.currentIndex);
    }
    const card = event.container.data[event.currentIndex];
    this.store.dispatch(BoardActions.moveCard({
      cardId: card.id, fromListId: card.listId,
      toListId: targetListId, position: event.currentIndex + 1
    }));
  }

  dropList(event: CdkDragDrop<TaskList[]>): void {
    if (!this.lists.length) {
      return;
    }

    moveItemInArray(this.lists, event.previousIndex, event.currentIndex);
    const orderedIds = this.lists.map(l => l.id);
    const boardId = this.lists[0]?.boardId;
    if (boardId) this.cardService.reorderLists(boardId, orderedIds).subscribe();
  }

  openCard(card: Card): void {
    if (!this.isLoggedIn) {
      this.snack.open('Please sign in to view card activity and details', 'Sign In', { duration: 5000 })
        .onAction().subscribe(() => this.router.navigate(['/auth/login']));
      return;
    }
    this.dialog.open(CardDetailComponent, {
      data: { card, workspaceId: this.currentBoard?.workspaceId },
      width: '800px',
      maxWidth: '95vw',
      height: 'auto',
      maxHeight: '90vh'
    });
  }

  get canManageBoard(): boolean {
    if (!this.isLoggedIn) {
      return false;
    }
    const currentUserId = this.authService.getCurrentUser()?.id;
    if (!currentUserId || !this.currentBoard) {
      return false;
    }

    return this.currentBoard.members?.some(member =>
      member.userId === currentUserId && member.role === 'ADMIN'
    ) ?? false;
  }

  editBoard(): void {
    if (!this.currentBoard) {
      return;
    }

    const boardId = this.currentBoard.id;
    const dialogRef = this.dialog.open(CreateBoardDialogComponent, {
      autoFocus: false,
      maxWidth: '95vw',
      data: {
        workspaceId: this.currentBoard.workspaceId,
        mode: 'edit',
        board: this.currentBoard,
      },
    });

    dialogRef.afterClosed().subscribe((payload?: Partial<Board>) => {
      if (!payload) {
        return;
      }

      this.boardService.update(boardId, payload).subscribe({
        next: () => {
          this.store.dispatch(BoardActions.loadBoard({ boardId }));
          this.snack.open('Board updated', 'Close', { duration: 2500 });
        },
        error: (err) => {
          const message =
            err?.error?.message ||
            err?.message ||
            `Failed to update board${err?.status ? ` (${err.status})` : ''}`;
          this.snack.open(message, 'Close', { duration: 4500 });
        }
      });
    });
  }

  addCard(listId: number): void {
    if (this.currentBoard?.isClosed) {
      return;
    }
    const boardId = +this.route.snapshot.params['id'];
    const dialogRef = this.dialog.open(CreateCardDialogComponent, {
      autoFocus: false,
      data: { listId, boardId, workspaceId: this.currentBoard?.workspaceId },
      width: '620px',
      maxWidth: '96vw',
      maxHeight: '90vh'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cardService.create(result).subscribe({
          next: (card) => {
            this.store.dispatch(BoardActions.addCard({ card }));
            this.snack.open('Card created', 'Close', { duration: 2500 });
          },
          error: (err) => {
            const message = err?.error?.message || 'Failed to create card';
            this.snack.open(message, 'Close', { duration: 4500 });
          }
        });
      }
    });
  }

  editCard(card: Card, event?: Event): void {
    event?.stopPropagation();

    const dialogRef = this.dialog.open(CreateCardDialogComponent, {
      autoFocus: false,
      data: {
        listId: card.listId,
        boardId: card.boardId,
        workspaceId: this.currentBoard?.workspaceId,
        mode: 'edit',
        card,
      },
      width: '620px',
      maxWidth: '96vw',
      maxHeight: '90vh'
    });

    dialogRef.afterClosed().subscribe((payload?: Partial<Card>) => {
      if (!payload) {
        return;
      }

      this.cardService.update(card.id, payload).subscribe({
        next: (updatedCard) => {
          this.store.dispatch(BoardActions.updateCard({ card: updatedCard }));
          this.snack.open('Card updated', 'Close', { duration: 2500 });
        },
        error: (err) => {
          const message = err?.error?.message || err?.message || 'Failed to update card';
          this.snack.open(message, 'Close', { duration: 4500 });
        }
      });
    });
  }
  addList(): void {
    if (this.currentBoard?.isClosed) {
      return;
    }
    const boardId = +this.route.snapshot.params['id'];
    const dialogRef = this.dialog.open(CreateListDialogComponent, {
      autoFocus: false,
      maxWidth: '95vw',
    });

    dialogRef.afterClosed().subscribe((payload?: CreateListDialogResult) => {
      if (!payload) {
        return;
      }

      this.cardService.createList(boardId, payload.name).subscribe({
        next: (list) => {
          this.lists = [...this.lists, list];
          this.store.dispatch(BoardActions.addList({ list }));
          this.snack.open('List created', 'Close', { duration: 2500 });
        },
        error: (err) => {
          const message =
            err?.error?.message ||
            err?.message ||
            `Failed to create list${err?.status ? ` (${err.status})` : ''}`;
          this.snack.open(message, 'Close', { duration: 4500 });
        }
      });
    });
  }

  deleteList(list: TaskList): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete List',
        message: `Are you sure you want to delete "${list.name}"? This action is permanent.`,
        confirmText: 'Delete List',
        isDanger: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.listService.delete(list.id).subscribe({
          next: () => {
            this.lists = this.lists.filter(l => l.id !== list.id);
            this.archivedLists = this.archivedLists.filter(l => l.id !== list.id);
            this.store.dispatch(BoardActions.loadBoard({ boardId: +this.route.snapshot.params['id'] }));
            this.snack.open('List deleted', 'Close', { duration: 2500 });
          },
          error: (err) => {
            const message = err?.error?.message || err?.message || 'Failed to delete list';
            this.snack.open(message, 'Close', { duration: 4500 });
          }
        });
      }
    });
  }

  editList(list: TaskList): void {
    this.listService.getById(list.id).subscribe({
      next: (freshList) => {
        const dialogRef = this.dialog.open(PromptDialogComponent, {
          width: '400px',
          data: {
            title: 'Rename List',
            message: 'Enter a new name for this list',
            placeholder: 'List Name',
            value: freshList.name,
            confirmText: 'Rename'
          }
        });

        dialogRef.afterClosed().subscribe(nextName => {
          if (!nextName) return;

          this.listService.update(freshList.id, nextName, freshList.color).subscribe({
            next: (updatedList) => {
              this.lists = this.lists.map(existing => existing.id === updatedList.id ? updatedList : existing);
              this.archivedLists = this.archivedLists.map(existing => existing.id === updatedList.id ? updatedList : existing);
              this.snack.open('List updated', 'Close', { duration: 2500 });
            },
            error: (err) => {
              const message = err?.error?.message || err?.message || 'Failed to update list';
              this.snack.open(message, 'Close', { duration: 4500 });
            }
          });
        });
      },
      error: (err) => {
        const message = err?.error?.message || err?.message || 'Failed to load list details';
        this.snack.open(message, 'Close', { duration: 4500 });
      }
    });
  }

  archiveList(list: TaskList): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Archive List',
        message: `Are you sure you want to archive "${list.name}"? This will move it to the archived section.`,
        confirmText: 'Archive',
        isDanger: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.listService.archive(list.id).subscribe({
          next: () => {
            this.lists = this.lists.filter(existing => existing.id !== list.id);
            this.archivedLists = [...this.archivedLists, { ...list, isArchived: true }];
            this.store.dispatch(BoardActions.loadBoard({ boardId: +this.route.snapshot.params['id'] }));
            this.snack.open('List archived', 'Close', { duration: 2500 });
          },
          error: (err) => {
            const message = err?.error?.message || err?.message || 'Failed to archive list';
            this.snack.open(message, 'Close', { duration: 4500 });
          }
        });
      }
    });
  }

  restoreList(list: TaskList): void {
    this.listService.unarchive(list.id).subscribe({
      next: () => {
        this.archivedLists = this.archivedLists.filter(existing => existing.id !== list.id);
        this.store.dispatch(BoardActions.loadBoard({ boardId: +this.route.snapshot.params['id'] }));
        this.loadArchivedLists(+this.route.snapshot.params['id']);
        this.snack.open('List restored', 'Close', { duration: 2500 });
      },
      error: (err) => {
        const message = err?.error?.message || err?.message || 'Failed to restore list';
        this.snack.open(message, 'Close', { duration: 4500 });
      }
    });
  }

  moveList(list: TaskList): void {
    if (!this.workspaceBoards.length) {
      this.snack.open('No other boards available in this workspace', 'Close', { duration: 3500 });
      return;
    }

    const dialogRef = this.dialog.open(MoveListDialogComponent, {
      width: '440px',
      maxWidth: '94vw',
      autoFocus: false,
      data: {
        listName: list.name,
        boards: this.workspaceBoards,
      },
    });

    dialogRef.afterClosed().subscribe((targetBoardId?: number) => {
      if (!targetBoardId || targetBoardId === this.currentBoard?.id) {
        return;
      }

      this.listService.move(list.id, targetBoardId).subscribe({
        next: () => {
          this.lists = this.lists.filter(existing => existing.id !== list.id);
          this.archivedLists = this.archivedLists.filter(existing => existing.id !== list.id);
          this.store.dispatch(BoardActions.loadBoard({ boardId: +this.route.snapshot.params['id'] }));
          this.loadArchivedLists(+this.route.snapshot.params['id']);
          this.snack.open('List moved', 'Close', { duration: 2500 });
        },
        error: (err) => {
          const message = err?.error?.message || err?.message || 'Failed to move list';
          this.snack.open(message, 'Close', { duration: 4500 });
        }
      });
    });
  }

  priorityClass(priority: string): object {
    return {
      'bg-slate-100 text-slate-600': priority === 'LOW',
      'bg-sky-100 text-sky-700': priority === 'MEDIUM',
      'bg-amber-100 text-amber-700': priority === 'HIGH',
      'bg-rose-100 text-rose-700': priority === 'CRITICAL',
    };
  }

  get totalCards(): number {
    return this.cards.length;
  }

  get overdueCards(): number {
    return this.cards.filter(card => card.isOverdue).length;
  }

  getOverdueCount(listId: number): number {
    return this.getCards(listId).filter(card => card.isOverdue).length;
  }

  getBoardInitials(): string {
    return this.currentBoard?.name
      ?.match(/[a-zA-Z0-9]+/g)
      ?.slice(0, 2)
      ?.map(part => part.charAt(0).toUpperCase())
      ?.join('') || 'BD';
  }

  getCardSummary(card: Card): string {
    if (card.description?.trim()) {
      return card.description.trim();
    }

    if (card.assigneeId) {
      return `Assigned to ${this.getAssigneeLabel(card.assigneeId)} and ready for the next move.`;
    }

    return 'Open the card for details, activity, and the next steps tied to this work item.';
  }

  getAssigneeLabel(userId: number): string {
    const user = this.assigneeDirectory[userId];
    if (!user) {
      return `user #${userId}`;
    }

    return user.username || user.fullName || `user #${userId}`;
  }

  openBoardInviteDialog(): void {
    if (!this.currentBoard || !this.canManageBoard) {
      return;
    }

    const dialogRef = this.dialog.open(BoardInviteDialogComponent, {
      autoFocus: false,
      maxWidth: '95vw',
      data: {
        currentUserId: this.authService.getCurrentUser()?.id ?? null,
        existingMemberIds: this.boardMembers.map(member => member.userId),
      },
    });

    dialogRef.afterClosed().subscribe((result?: BoardInviteDialogResult) => {
      if (!result || !this.currentBoard) {
        return;
      }

      this.boardService.addMember(this.currentBoard.id, result.user.id, result.role).subscribe({
        next: (member) => {
          this.boardMembers = [...this.boardMembers, member].sort((a, b) => a.userId - b.userId);
          this.currentBoard = this.currentBoard ? { ...this.currentBoard, members: this.boardMembers } : this.currentBoard;
          this.boardMemberDirectory = { ...this.boardMemberDirectory, [result.user.id]: result.user };
          this.snack.open(`${result.user.fullName} added to board`, 'Close', { duration: 2500 });
        },
        error: (err) => {
          const message = err?.error?.message || err?.message || 'Failed to add board member';
          this.snack.open(message, 'Close', { duration: 4500 });
        }
      });
    });
  }

  canRemoveBoardMember(member: BoardMember): boolean {
    const currentUserId = this.authService.getCurrentUser()?.id;
    return !!currentUserId && member.userId !== currentUserId && member.userId !== this.currentBoard?.createdById;
  }

  canChangeBoardMemberRole(member: BoardMember): boolean {
    const currentUserId = this.authService.getCurrentUser()?.id;
    return !!currentUserId &&
      member.userId !== currentUserId &&
      member.userId !== this.currentBoard?.createdById;
  }

  changeBoardMemberRole(member: BoardMember): void {
    if (!this.currentBoard || !this.canManageBoard || !this.canChangeBoardMemberRole(member)) {
      return;
    }

    const nextRole: BoardMember['role'] = member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN';
    const memberName = this.getBoardMemberLabel(member.userId);
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Change Role',
        message: `Set ${memberName} as a ${nextRole.toLowerCase()}?`,
        confirmText: 'Change Role'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.boardService.updateMemberRole(this.currentBoard!.id, member.userId, nextRole).subscribe({
          next: (updatedMember) => {
            this.boardMembers = this.boardMembers.map(existing =>
              existing.userId === member.userId ? updatedMember : existing
            );
            this.currentBoard = this.currentBoard ? { ...this.currentBoard, members: this.boardMembers } : this.currentBoard;
            this.snack.open(`${memberName} is now ${nextRole.toLowerCase()}`, 'Close', { duration: 2500 });
          },
          error: (err) => {
            const message = err?.error?.message || err?.message || 'Failed to update board member role';
            this.snack.open(message, 'Close', { duration: 4500 });
          }
        });
      }
    });
  }

  removeBoardMember(member: BoardMember): void {
    if (!this.currentBoard || !this.canManageBoard || !this.canRemoveBoardMember(member)) {
      return;
    }

    const memberName = this.getBoardMemberLabel(member.userId);
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Remove Member',
        message: `Are you sure you want to remove ${memberName} from this board?`,
        confirmText: 'Remove',
        isDanger: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.boardService.removeMember(this.currentBoard!.id, member.userId).subscribe({
          next: () => {
            this.boardMembers = this.boardMembers.filter(existing => existing.userId !== member.userId);
            this.currentBoard = this.currentBoard ? { ...this.currentBoard, members: this.boardMembers } : this.currentBoard;
            this.snack.open(`${memberName} removed from board`, 'Close', { duration: 2500 });
          },
          error: (err) => {
            const message = err?.error?.message || err?.message || 'Failed to remove board member';
            this.snack.open(message, 'Close', { duration: 4500 });
          }
        });
      }
    });
  }

  closeBoard(): void {
    if (!this.currentBoard || !this.canManageBoard || this.currentBoard.isClosed) {
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Close Board',
        message: `Are you sure you want to close "${this.currentBoard.name}"? Active work will be paused.`,
        confirmText: 'Close Board',
        isDanger: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.boardService.close(this.currentBoard!.id).subscribe({
          next: () => {
            const closedBoard = this.currentBoard ? { ...this.currentBoard, isClosed: true } : this.currentBoard;
            this.currentBoard = closedBoard;
            if (closedBoard) {
              this.store.dispatch(BoardActions.loadBoard({ boardId: closedBoard.id }));
            }
            this.snack.open('Board closed', 'Close', { duration: 2500 });
          },
          error: (err) => {
            const message = err?.error?.message || err?.message || 'Failed to close board';
            this.snack.open(message, 'Close', { duration: 4500 });
          }
        });
      }
    });
  }

  getBoardMemberLabel(userId: number): string {
    const user = this.boardMemberDirectory[userId];
    return user ? user.username || user.fullName || `User #${userId}` : `User #${userId}`;
  }

  getBoardMemberInitials(userId: number): string {
    const user = this.boardMemberDirectory[userId];
    if (!user) {
      return String(userId).slice(-2).padStart(2, '0');
    }

    return user.fullName
      ?.match(/[a-zA-Z0-9]+/g)
      ?.slice(0, 2)
      ?.map(part => part.charAt(0).toUpperCase())
      ?.join('') || 'U';
  }

  formatPriority(priority: string): string {
    return priority.toLowerCase();
  }

  formatStatus(status: string): string {
    return status.toLowerCase().replace(/_/g, ' ');
  }

  trackByList(_: number, list: TaskList): number {
    return list.id;
  }

  trackByCard(_: number, card: Card): number {
    return card.id;
  }

  trackByBoardMember(_: number, member: BoardMember): number {
    return member.id;
  }

  trackByArchivedList(_: number, list: TaskList): number {
    return list.id;
  }

  private loadAssigneeUsers(cards: Card[]): void {
    const unresolvedIds = Array.from(
      new Set(cards.map(card => card.assigneeId).filter((userId): userId is number => userId != null))
    ).filter(userId => !this.assigneeDirectory[userId]);

    if (!unresolvedIds.length) {
      return;
    }

    forkJoin(
      unresolvedIds.map(userId =>
        this.authService.getUserById(userId).pipe(catchError(() => of(null)))
      )
    ).subscribe((users) => {
      users
        .filter((user): user is User => !!user)
        .forEach((user) => {
          this.assigneeDirectory[user.id] = user;
        });
    });
  }

  private loadBoardMemberUsers(members: BoardMember[]): void {
    const unresolvedIds = Array.from(new Set((members || []).map(member => member.userId)))
      .filter(userId => !this.boardMemberDirectory[userId]);

    if (!unresolvedIds.length) {
      return;
    }

    forkJoin(
      unresolvedIds.map(userId =>
        this.authService.getUserById(userId).pipe(catchError(() => of(null)))
      )
    ).subscribe((users) => {
      const nextDirectory = { ...this.boardMemberDirectory };

      users
        .filter((user): user is User => !!user)
        .forEach((user) => {
          nextDirectory[user.id] = user;
        });

      this.boardMemberDirectory = nextDirectory;
    });
  }

  private loadArchivedLists(boardId: number): void {
    this.listService.getArchived(boardId).pipe(
      catchError(() => of([] as TaskList[]))
    ).subscribe((lists) => {
      this.archivedLists = lists;
    });
  }

  private loadWorkspaceBoards(workspaceId: number, currentBoardId: number): void {
    this.boardService.getByWorkspace(workspaceId).pipe(
      catchError(() => of([] as Board[]))
    ).subscribe((boards) => {
      this.workspaceBoards = boards.filter(board => board.id !== currentBoardId);
    });
  }

  ngOnDestroy(): void {
    this.store.dispatch(BoardActions.clearBoard());
    this.destroy$.next();
    this.destroy$.complete();
  }
}
