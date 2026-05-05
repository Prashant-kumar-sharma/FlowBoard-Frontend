import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { WorkspaceService } from '../../core/services/workspace.service';
import { BoardService } from '../../core/services/board.service';
import { CreateWorkspaceRequest, Workspace } from '../../core/models/workspace.model';
import { Board, CreateBoardRequest } from '../../core/models/board.model';
import { CreateWorkspaceDialogComponent } from './create-workspace-dialog.component';
import { CreateBoardDialogComponent } from '../board/create-board-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { AuthService } from '../../core/auth/auth.service';
import { PaymentService } from '../../core/services/payment.service';
import { PaymentSummary } from '../../core/models/payment.model';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatCardModule, MatDialogModule, MatIconModule, MatSnackBarModule],
  template: `
    <div class="dashboard-shell min-h-screen overflow-hidden">
      <div class="dashboard-glow dashboard-glow-left"></div>
      <div class="dashboard-glow dashboard-glow-right"></div>

      <div class="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <section class="hero-panel rounded-[32px] px-6 py-8 text-slate-950 shadow-[0_22px_65px_rgba(15,23,42,0.08)] sm:px-8 lg:px-10">
          <div class="grid gap-8 lg:grid-cols-[1.4fr,0.9fr] lg:items-end">
            <div>
              <div class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/78 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">
                <span class="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.95)]"></span>
                Workspace command center
              </div>

              <h1 class="mt-5 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
                Welcome back, {{ userFirstName }}.
              </h1>
              <p class="mt-4 max-w-2xl text-sm leading-7 text-slate-700 sm:text-base">
                Keep every workspace, sprint board, and collaborator in one place with a cleaner overview that makes the next move obvious.
              </p>

              <div class="mt-8 flex flex-wrap items-center gap-3">
                <button mat-flat-button color="primary" class="hero-action-button" (click)="createWorkspace()">
                  <mat-icon>add</mat-icon>
                  New Workspace
                </button>
                <a
                  mat-stroked-button
                  [routerLink]="['/profile']"
                  class="hero-secondary-button"
                >
                  <mat-icon>person</mat-icon>
                  Profile
                </a>
                <button
                  mat-stroked-button
                  type="button"
                  class="hero-secondary-button"
                  (click)="openPremium()"
                >
                  <mat-icon>{{ paymentSummary?.premium ? 'verified' : 'workspace_premium' }}</mat-icon>
                  {{ paymentSummary?.premium ? 'Premium Active' : 'Go Premium' }}
                </button>
                <a
                  *ngIf="authService.isPlatformAdmin()"
                  mat-stroked-button
                  routerLink="/admin"
                  class="hero-secondary-button admin-console-button"
                >
                  <mat-icon>admin_panel_settings</mat-icon>
                  Admin Console
                </a>
              </div>
            </div>

            <div class="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <article class="metric-card">
                <p class="metric-label">Workspaces</p>
                <p class="metric-value">{{ workspaces.length }}</p>
                <p class="metric-copy">Studios, teams, and side projects under one roof.</p>
              </article>

              <article class="metric-card">
                <p class="metric-label">Boards</p>
                <p class="metric-value">{{ boards.length }}</p>
                <p class="metric-copy">Every active planning surface you can jump into right now.</p>
              </article>

              <article class="metric-card">
                <p class="metric-label">Collaborators</p>
                <p class="metric-value">{{ collaboratorCount }}</p>
                <p class="metric-copy">People contributing across your current workspace network.</p>
              </article>
            </div>
          </div>
        </section>

        <section *ngIf="loading" class="grid gap-4 lg:grid-cols-3">
          <div *ngFor="let card of skeletonCards" class="loading-panel rounded-[28px] p-6">
            <div class="h-3 w-24 rounded-full bg-slate-200/70"></div>
            <div class="mt-4 h-8 w-2/3 rounded-full bg-slate-200/80"></div>
            <div class="mt-3 h-3 w-full rounded-full bg-slate-200/70"></div>
            <div class="mt-2 h-3 w-4/5 rounded-full bg-slate-200/60"></div>
            <div class="mt-8 grid grid-cols-2 gap-3">
              <div class="h-20 rounded-2xl bg-slate-100/80"></div>
              <div class="h-20 rounded-2xl bg-slate-100/70"></div>
            </div>
          </div>
        </section>

        <ng-container *ngIf="!loading">
          <section
            *ngFor="let ws of workspaces; trackBy: trackByWorkspace"
            class="workspace-panel rounded-[30px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_22px_65px_rgba(15,23,42,0.08)] backdrop-blur sm:p-6"
          >
            <ng-container *ngIf="getBoardsForWorkspace(ws.id) as workspaceBoards">
              <div class="grid gap-6 lg:grid-cols-[0.95fr,1.55fr] lg:items-start">
                <div class="workspace-overview rounded-[26px] p-6 text-slate-900">
                  <div class="flex items-start justify-between gap-4">
                    <div class="flex items-center gap-4 min-w-0">
                      <div class="workspace-avatar">
                        {{ getInitials(ws.name) }}
                      </div>
                      <div class="min-w-0">
                        <p class="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700/70">Workspace</p>
                        <h2 class="mt-2 truncate text-2xl font-semibold text-slate-900">{{ ws.name }}</h2>
                        <p class="mt-2 text-sm leading-6 text-slate-600">
                          {{ getWorkspaceDescription(ws, workspaceBoards.length) }}
                        </p>
                      </div>
                    </div>

                    <a
                      [routerLink]="['/workspace', ws.id]"
                      class="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-300 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
                    >
                      <span>Open workspace</span>
                      <mat-icon class="!text-base">arrow_forward</mat-icon>
                    </a>
                  </div>

                  <div class="mt-6 flex flex-wrap gap-3">
                    <div class="glass-chip">
                      <mat-icon>dashboard</mat-icon>
                      {{ workspaceBoards.length }} boards
                    </div>
                    <div class="glass-chip">
                      <mat-icon>groups</mat-icon>
                      {{ getWorkspaceMemberCount(ws) }} members
                    </div>
                    <div class="glass-chip">
                      <mat-icon>{{ ws.visibility === 'PUBLIC' ? 'public' : 'lock' }}</mat-icon>
                      {{ ws.visibility === 'PUBLIC' ? 'Shared' : 'Private' }}
                    </div>
                  </div>

                  <div class="mt-6 flex flex-wrap gap-3">
                    <button
                      *ngIf="canManageWorkspace(ws)"
                      mat-flat-button
                      color="primary"
                      class="workspace-primary-button"
                      (click)="createBoard(ws.id)"
                    >
                      <mat-icon>add_circle</mat-icon>
                      Create Board
                    </button>
                    <button
                      *ngIf="canManageWorkspace(ws)"
                      mat-stroked-button
                      type="button"
                      class="workspace-edit-button"
                      (click)="editWorkspace(ws, $event)"
                    >
                      <mat-icon>edit</mat-icon>
                      Edit Workspace
                    </button>
                    <button
                      *ngIf="canManageWorkspace(ws)"
                      mat-stroked-button
                      type="button"
                      color="warn"
                      class="workspace-danger-button"
                      (click)="deleteWorkspace(ws, $event)"
                    >
                      <mat-icon>delete</mat-icon>
                      Delete Workspace
                    </button>
                  </div>
                </div>

                <div class="workspace-board-grid">
                  <article
                    *ngFor="let board of workspaceBoards; trackBy: trackByBoard"
                    class="board-card group rounded-[24px] p-6 text-white shadow-[0_20px_55px_rgba(15,23,42,0.18)]"
                    [style.background]="board.background"
                  >
                    <div class="board-card-overlay"></div>
                    <div class="relative flex h-full min-h-[260px] flex-col justify-between">
                      <div>
                        <div class="flex items-center justify-between gap-3">
                          <p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">
                            {{ board.visibility === 'PUBLIC' ? 'Shared board' : 'Private board' }}
                          </p>
                          <span class="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium text-white/85">
                            {{ board.isClosed ? 'Closed' : 'Active' }}
                          </span>
                        </div>

                        <h3 class="mt-5 text-2xl font-semibold leading-tight">{{ board.name }}</h3>
                        <p class="truncate-2 mt-3 text-sm leading-6 text-white/80">
                          {{ board.description || 'A focused board for planning, updates, and day-to-day momentum.' }}
                        </p>
                      </div>

                      <div class="mt-6">
                        <div class="flex flex-wrap gap-2 text-xs text-white/85">
                          <span class="board-chip">
                            <mat-icon>groups</mat-icon>
                            {{ getBoardMemberCount(board) }} members
                          </span>
                          <span class="board-chip">
                            <mat-icon>palette</mat-icon>
                            Custom background
                          </span>
                        </div>

                        <div class="mt-5 flex flex-wrap items-center gap-2">
                          <a
                            [routerLink]="['/board', board.id]"
                            class="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/12 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
                          >
                            <span>Open board</span>
                            <mat-icon class="!text-base">north_east</mat-icon>
                          </a>

                          <button
                            *ngIf="canManageBoard(board) && !board.isClosed"
                            mat-stroked-button
                            type="button"
                            class="board-delete-button"
                            (click)="closeBoard(board, $event)"
                          >
                            Close
                          </button>

                          <button
                            *ngIf="canManageBoard(board)"
                            mat-stroked-button
                            type="button"
                            class="board-delete-button"
                            (click)="editBoard(board, $event)"
                          >
                            Edit
                          </button>

                          <button
                            *ngIf="canManageBoard(board)"
                            mat-stroked-button
                            type="button"
                            class="board-delete-button"
                            (click)="deleteBoard(board, $event)"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>

                  <button
                    *ngIf="canManageWorkspace(ws)"
                    mat-stroked-button
                    class="create-board-tile flex min-h-[260px] flex-col items-start justify-between rounded-[24px] border-dashed p-7 text-left"
                    (click)="createBoard(ws.id)"
                  >
                    <span class="create-board-icon">
                      <mat-icon>add</mat-icon>
                    </span>
                    <span>
                      <span class="block text-lg font-semibold text-slate-900">Create another board</span>
                      <span class="mt-2 block text-sm leading-6 text-slate-600">
                        Start a new planning space for launches, sprints, or team rituals inside {{ ws.name }}.
                      </span>
                    </span>
                  </button>
                </div>
              </div>
            </ng-container>
          </section>

          <section
            *ngIf="sharedBoards.length > 0"
            class="rounded-[30px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_22px_65px_rgba(15,23,42,0.08)] backdrop-blur sm:p-6"
          >
            <div class="shared-boards-header rounded-[26px] p-6 text-slate-900">
              <p class="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700/70">Shared with you</p>
              <h2 class="mt-2 text-2xl font-semibold text-slate-900">Boards you can access through collaboration</h2>
              <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                These boards are available because someone added you directly as a board collaborator.
              </p>
            </div>

            <div class="mt-6 workspace-board-grid">
              <article
                *ngFor="let board of sharedBoards; trackBy: trackByBoard"
                class="board-card group rounded-[24px] p-6 text-white shadow-[0_20px_55px_rgba(15,23,42,0.18)]"
                [style.background]="board.background"
              >
                <div class="board-card-overlay"></div>
                <div class="relative flex h-full min-h-[260px] flex-col justify-between">
                  <div>
                    <div class="flex items-center justify-between gap-3">
                      <p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">
                        {{ board.visibility === 'PUBLIC' ? 'Shared board' : 'Private board' }}
                      </p>
                      <span class="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium text-white/85">
                        {{ board.isClosed ? 'Closed' : 'Active' }}
                      </span>
                    </div>

                    <h3 class="mt-5 text-2xl font-semibold leading-tight">{{ board.name }}</h3>
                    <p class="truncate-2 mt-3 text-sm leading-6 text-white/80">
                      {{ board.description || 'A focused board for planning, updates, and day-to-day momentum.' }}
                    </p>
                  </div>

                  <div class="mt-6">
                    <div class="flex flex-wrap gap-2 text-xs text-white/85">
                      <span class="board-chip">
                        <mat-icon>groups</mat-icon>
                        {{ getBoardMemberCount(board) }} members
                      </span>
                      <span class="board-chip">
                        <mat-icon>share</mat-icon>
                        Collaborator access
                      </span>
                    </div>

                    <div class="mt-5 flex flex-wrap items-center gap-2">
                      <a
                        [routerLink]="['/board', board.id]"
                        class="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/12 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
                      >
                        <span>Open board</span>
                        <mat-icon class="!text-base">north_east</mat-icon>
                      </a>

                      <button
                        *ngIf="canManageBoard(board) && !board.isClosed"
                        mat-stroked-button
                        type="button"
                        class="board-delete-button"
                        (click)="closeBoard(board, $event)"
                      >
                        Close
                      </button>

                      <button
                        *ngIf="canManageBoard(board)"
                        mat-stroked-button
                        type="button"
                        class="board-delete-button"
                        (click)="editBoard(board, $event)"
                      >
                        Edit
                      </button>

                      <button
                        *ngIf="canManageBoard(board)"
                        mat-stroked-button
                        type="button"
                        class="board-delete-button"
                        (click)="deleteBoard(board, $event)"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </section>

          <section
            *ngIf="workspaces.length === 0 && sharedBoards.length === 0"
            class="rounded-[32px] border border-dashed border-sky-200 bg-white/90 px-6 py-12 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
          >
            <div class="mx-auto flex max-w-xl flex-col items-center">
              <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 shadow-[0_0_40px_rgba(14,165,233,0.22)]">
                <mat-icon class="!text-3xl">weekend</mat-icon>
              </div>
              <h2 class="mt-6 text-3xl font-semibold text-slate-900">Your dashboard is ready for its first workspace</h2>
              <p class="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
                Create a workspace to group boards, invite teammates, and turn this empty canvas into an active command center.
              </p>
              <button mat-flat-button color="primary" class="mt-8 hero-action-button" (click)="createWorkspace()">
                <mat-icon>add</mat-icon>
                Create your first workspace
              </button>
            </div>
          </section>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-shell {
      position: relative;
      background:
        radial-gradient(circle at top left, rgba(14, 165, 233, 0.14), transparent 28rem),
        radial-gradient(circle at 85% 10%, rgba(59, 130, 246, 0.18), transparent 24rem),
        linear-gradient(180deg, #f8fbff 0%, #eef4fb 48%, #f7f9fc 100%);
    }

    .dashboard-glow {
      pointer-events: none;
      position: absolute;
      width: 20rem;
      height: 20rem;
      border-radius: 9999px;
      filter: blur(56px);
      opacity: 0.38;
    }

    .dashboard-glow-left {
      top: 5rem;
      left: -5rem;
      background: rgba(14, 165, 233, 0.42);
    }

    .dashboard-glow-right {
      top: 14rem;
      right: -6rem;
      background: rgba(56, 189, 248, 0.28);
    }

    .hero-panel {
      position: relative;
      overflow: hidden;
      background:
        radial-gradient(circle at top left, rgba(255, 255, 255, 0.96), transparent 22rem),
        radial-gradient(circle at 82% 18%, rgba(226, 232, 240, 0.65), transparent 18rem),
        linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.96) 52%, rgba(241,245,249,0.94) 100%);
      border: 1px solid rgba(226, 232, 240, 0.9);
    }

    .hero-panel::after {
      content: '';
      position: absolute;
      inset: 0;
      background:
        linear-gradient(120deg, rgba(255, 255, 255, 0.52), transparent 30%),
        repeating-linear-gradient(
          115deg,
          rgba(148, 163, 184, 0.06) 0,
          rgba(148, 163, 184, 0.06) 1px,
          transparent 1px,
          transparent 18px
        );
      pointer-events: none;
    }

    .metric-card {
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(226, 232, 240, 0.95);
      border-radius: 1.5rem;
      background: rgba(255, 255, 255, 0.76);
      backdrop-filter: blur(14px);
      padding: 1.25rem;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85);
    }

    .metric-label {
      margin: 0;
      font-size: 0.72rem;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: rgba(71, 85, 105, 0.8);
    }

    .metric-value {
      margin: 0.65rem 0 0;
      font-size: clamp(2rem, 4vw, 2.7rem);
      font-weight: 700;
      line-height: 1;
      color: #0f172a;
    }

    .metric-copy {
      margin: 0.85rem 0 0;
      font-size: 0.92rem;
      line-height: 1.6;
      color: #475569;
    }

    .workspace-overview {
      background:
        linear-gradient(180deg, rgba(240, 249, 255, 0.95), rgba(255, 255, 255, 0.95)),
        linear-gradient(135deg, rgba(14, 165, 233, 0.14), transparent 45%);
      border: 1px solid rgba(148, 163, 184, 0.16);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75);
    }

    .shared-boards-header {
      background:
        linear-gradient(180deg, rgba(248, 250, 252, 0.96), rgba(255, 255, 255, 0.95)),
        linear-gradient(135deg, rgba(56, 189, 248, 0.12), transparent 45%);
      border: 1px solid rgba(148, 163, 184, 0.16);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75);
    }

    .workspace-avatar {
      display: flex;
      height: 3.75rem;
      width: 3.75rem;
      align-items: center;
      justify-content: center;
      border-radius: 1.4rem;
      background: linear-gradient(135deg, #0284c7, #0f172a);
      color: white;
      font-size: 1.3rem;
      font-weight: 700;
      box-shadow: 0 18px 40px rgba(3, 105, 161, 0.28);
      text-transform: uppercase;
    }

    .glass-chip,
    .board-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      border-radius: 9999px;
      font-size: 0.82rem;
      font-weight: 600;
      line-height: 1;
    }

    .glass-chip {
      border: 1px solid rgba(148, 163, 184, 0.2);
      background: rgba(255, 255, 255, 0.78);
      color: #334155;
      padding: 0.8rem 1rem;
    }

    .glass-chip mat-icon,
    .board-chip mat-icon {
      font-size: 1rem;
      width: 1rem;
      height: 1rem;
    }

    .board-card {
      position: relative;
      overflow: hidden;
      transform: translateY(0);
      transition: transform 220ms ease, box-shadow 220ms ease;
    }

    .workspace-board-grid {
      display: grid;
      gap: 1.25rem;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      align-items: stretch;
    }

    @media (min-width: 1400px) {
      .workspace-board-grid {
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      }
    }

    .board-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 26px 65px rgba(15, 23, 42, 0.24);
    }

    .board-card-overlay {
      position: absolute;
      inset: 0;
      background:
        linear-gradient(180deg, rgba(15, 23, 42, 0.02), rgba(15, 23, 42, 0.62)),
        radial-gradient(circle at top left, rgba(255, 255, 255, 0.28), transparent 42%);
      opacity: 0.95;
      pointer-events: none;
    }

    .board-chip {
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.1);
      padding: 0.68rem 0.9rem;
      color: rgba(255, 255, 255, 0.92);
    }

    .create-board-tile {
      width: 100%;
      min-width: 0;
      border-radius: 1.5rem !important;
      border-color: rgba(14, 165, 233, 0.28);
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.86), rgba(240, 249, 255, 0.95));
      transition: transform 220ms ease, border-color 220ms ease, box-shadow 220ms ease;
      overflow: hidden;
    }

    .create-board-tile:hover {
      transform: translateY(-4px);
      border-color: rgba(2, 132, 199, 0.42);
      box-shadow: 0 20px 50px rgba(14, 165, 233, 0.12);
    }

    .create-board-icon {
      display: inline-flex;
      height: 3.25rem;
      width: 3.25rem;
      align-items: center;
      justify-content: center;
      border-radius: 1rem;
      background: linear-gradient(135deg, rgba(14, 165, 233, 0.16), rgba(2, 132, 199, 0.28));
      color: #0369a1;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75);
    }

    .create-board-icon mat-icon {
      font-size: 1.4rem;
      width: 1.4rem;
      height: 1.4rem;
    }

    .loading-panel {
      border: 1px solid rgba(148, 163, 184, 0.15);
      background: rgba(255, 255, 255, 0.82);
      box-shadow: 0 18px 45px rgba(15, 23, 42, 0.06);
      animation: pulse-panel 1.6s ease-in-out infinite;
    }

    .truncate-2 {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
    }

    .hero-action-button,
    .hero-secondary-button,
    .workspace-primary-button,
    .workspace-edit-button,
    .workspace-danger-button,
    .board-delete-button {
      border-radius: 9999px;
    }

    .hero-action-button,
    .workspace-primary-button {
      box-shadow: 0 18px 35px rgba(2, 132, 199, 0.26);
    }

    .hero-secondary-button {
      color: #0f172a !important;
      border-color: rgba(203, 213, 225, 0.95) !important;
      background: rgba(255, 255, 255, 0.72) !important;
    }

    .workspace-edit-button {
      color: #334155 !important;
      border-color: rgba(148, 163, 184, 0.24) !important;
      background: rgba(255, 255, 255, 0.84) !important;
    }

    .board-delete-button {
      border-color: rgba(255, 255, 255, 0.24) !important;
      color: white !important;
      background: rgba(15, 23, 42, 0.12) !important;
    }

    @keyframes pulse-panel {
      0%, 100% {
        opacity: 0.92;
      }
      50% {
        opacity: 1;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  workspaces: Workspace[] = [];
  boards: Board[] = [];
  paymentSummary: PaymentSummary | null = null;
  loading = true;
  readonly skeletonCards = Array.from({ length: 3 });

  constructor(
    private workspaceService: WorkspaceService,
    private boardService: BoardService,
    private dialog: MatDialog,
    private router: Router,
    private snack: MatSnackBar,
    public authService: AuthService,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    this.workspaces = [];
    this.boards = [];
    this.loading = true;
    this.loadPaymentSummary();

    this.workspaceService.getMy().subscribe({
      next: (workspaces) => {
        this.workspaces = workspaces;
        this.boardService.getMy().pipe(
          finalize(() => {
            this.loading = false;
          })
        ).subscribe({
          next: (boards) => {
            this.boards = boards;
          },
          error: (err) => {
            this.boards = [];
            const message =
              err?.error?.message ||
              err?.message ||
              `Failed to load boards${err?.status ? ` (${err.status})` : ''}`;
            this.snack.open(message, 'Close', { duration: 4500 });
          }
        });
      },
      error: (err) => {
        this.workspaces = [];
        this.boards = [];
        this.loading = false;
        const message =
          err?.error?.message ||
          err?.message ||
          `Failed to load dashboard${err?.status ? ` (${err.status})` : ''}`;
        this.snack.open(message, 'Close', { duration: 4500 });
      }
    });
  }

  getBoardsForWorkspace(wsId: number): Board[] {
    return this.boards.filter(b => b.workspaceId === wsId);
  }

  get sharedBoards(): Board[] {
    const visibleWorkspaceIds = new Set(this.workspaces.map(workspace => workspace.id));
    return this.boards.filter(board => !visibleWorkspaceIds.has(board.workspaceId));
  }

  get userFirstName(): string {
    return this.authService.getCurrentUser()?.fullName?.match(/[a-zA-Z0-9]+/g)?.[0] || 'there';
  }

  get collaboratorCount(): number {
    const collaboratorIds = new Set<number>();
    this.workspaces.forEach((workspace) => {
      workspace.members?.forEach((member) => collaboratorIds.add(member.userId));
    });
    return collaboratorIds.size;
  }

  getInitials(name: string): string {
    return name
      .match(/[a-zA-Z0-9]+/g)
      ?.slice(0, 2)
      ?.map((part) => part.charAt(0).toUpperCase())
      ?.join('') || 'WS';
  }

  getWorkspaceDescription(workspace: Workspace, boardCount: number): string {
    return workspace.description?.trim() || `${boardCount} board${boardCount === 1 ? '' : 's'} ready for planning and follow-through.`;
  }

  getWorkspaceMemberCount(workspace: Workspace): number {
    return workspace.members?.length ?? 0;
  }

  getBoardMemberCount(board: Board): number {
    return board.members?.length ?? 0;
  }

  canManageWorkspace(workspace: Workspace): boolean {
    const currentUserId = this.authService.getCurrentUser()?.id;
    return !!currentUserId && !!workspace.members?.some(
      member => member.userId === currentUserId && member.role === 'ADMIN'
    );
  }

  canManageBoard(board: Board): boolean {
    const currentUserId = this.authService.getCurrentUser()?.id;
    return !!currentUserId && !!board.members?.some(
      member => member.userId === currentUserId && member.role === 'ADMIN'
    );
  }

  trackByWorkspace(_: number, workspace: Workspace): number {
    return workspace.id;
  }

  trackByBoard(_: number, board: Board): number {
    return board.id;
  }

  createWorkspace(): void {
    const dialogRef = this.dialog.open(CreateWorkspaceDialogComponent, {
      autoFocus: false,
      maxWidth: '95vw',
      panelClass: 'workspace-dialog-panel',
    });

    dialogRef.afterClosed().subscribe((payload?: CreateWorkspaceRequest) => {
      if (!payload) {
        return;
      }

      this.workspaceService.create(payload).subscribe({
      next: (workspace) => {
        this.workspaces = [workspace, ...this.workspaces];
        this.snack.open('Workspace created', 'Close', { duration: 2500 });
        this.router.navigate(['/workspace', workspace.id]);
      },
      error: (err) => {
        if (this.handlePaymentRequired(err)) {
          return;
        }
        const message =
          err?.error?.message ||
          err?.message ||
          `Failed to create workspace${err?.status ? ` (${err.status})` : ''}`;
        this.snack.open(message, 'Close', { duration: 4500 });
      }
      });
    });
  }

  editWorkspace(workspace: Workspace, event?: Event): void {
    event?.stopPropagation();

    const dialogRef = this.dialog.open(CreateWorkspaceDialogComponent, {
      autoFocus: false,
      maxWidth: '95vw',
      panelClass: 'workspace-dialog-panel',
      data: { mode: 'edit', workspace },
    });

    dialogRef.afterClosed().subscribe((payload?: CreateWorkspaceRequest) => {
      if (!payload) {
        return;
      }

      this.workspaceService.update(workspace.id, payload).subscribe({
        next: (updatedWorkspace) => {
          this.workspaces = this.workspaces.map(ws => ws.id === workspace.id ? updatedWorkspace : ws);
          this.snack.open('Workspace updated', 'Close', { duration: 2500 });
        },
        error: (err) => {
          const message =
            err?.error?.message ||
            err?.message ||
            `Failed to update workspace${err?.status ? ` (${err.status})` : ''}`;
          this.snack.open(message, 'Close', { duration: 4500 });
        }
      });
    });
  }

  createBoard(workspaceId: number): void {
    const dialogRef = this.dialog.open(CreateBoardDialogComponent, {
      autoFocus: false,
      maxWidth: '95vw',
      data: { workspaceId },
    });

    dialogRef.afterClosed().subscribe((payload?: CreateBoardRequest) => {
      if (!payload) {
        return;
      }

      this.boardService.create(payload).subscribe({
        next: (board) => {
          this.boards = [board, ...this.boards];
          this.snack.open('Board created', 'Close', { duration: 2500 });
          this.router.navigate(['/board', board.id]);
        },
        error: (err) => {
          const message =
            err?.error?.message ||
            err?.message ||
            `Failed to create board${err?.status ? ` (${err.status})` : ''}`;
          this.snack.open(message, 'Close', { duration: 4500 });
        }
      });
    });
  }

  editBoard(board: Board, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    const dialogRef = this.dialog.open(CreateBoardDialogComponent, {
      autoFocus: false,
      maxWidth: '95vw',
      data: { workspaceId: board.workspaceId, mode: 'edit', board },
    });

    dialogRef.afterClosed().subscribe((payload?: CreateBoardRequest) => {
      if (!payload) {
        return;
      }

      this.boardService.update(board.id, payload).subscribe({
        next: (updatedBoard) => {
          this.boards = this.boards.map(item => item.id === board.id ? updatedBoard : item);
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

  deleteWorkspace(workspace: Workspace, event?: Event): void {
    event?.stopPropagation();
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Workspace',
        message: `Are you sure you want to delete "${workspace.name}"? This action is permanent.`,
        confirmText: 'Delete Workspace',
        isDanger: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.workspaceService.delete(workspace.id).subscribe({
          next: () => {
            this.workspaces = this.workspaces.filter(w => w.id !== workspace.id);
            this.boards = this.boards.filter(b => b.workspaceId !== workspace.id);
            this.snack.open('Workspace deleted', 'Close', { duration: 2500 });
          },
          error: (err) => {
            const message = err?.error?.message || err?.message || 'Failed to delete workspace';
            this.snack.open(message, 'Close', { duration: 4500 });
          }
        });
      }
    });
  }

  deleteBoard(board: Board, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Board',
        message: `Are you sure you want to delete "${board.name}"? This action is permanent.`,
        confirmText: 'Delete Board',
        isDanger: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.boardService.delete(board.id).subscribe({
          next: () => {
            this.boards = this.boards.filter(b => b.id !== board.id);
            this.snack.open('Board deleted', 'Close', { duration: 2500 });
          },
          error: (err) => {
            const message = err?.error?.message || err?.message || 'Failed to delete board';
            this.snack.open(message, 'Close', { duration: 4500 });
          }
        });
      }
    });
  }

  closeBoard(board: Board, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Close Board',
        message: `Are you sure you want to close "${board.name}"?`,
        confirmText: 'Close Board',
        isDanger: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.boardService.close(board.id).subscribe({
          next: () => {
            this.boards = this.boards.map(existing =>
              existing.id === board.id ? { ...existing, isClosed: true } : existing
            );
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

  openPremium(reason?: string, workspaceId?: number): void {
    this.router.navigate(['/billing/premium'], {
      queryParams: {
        ...(reason ? { reason } : {}),
        ...(workspaceId ? { workspaceId } : {}),
      }
    });
  }

  private loadPaymentSummary(): void {
    this.paymentService.getSummary().subscribe({
      next: (summary) => {
        this.paymentSummary = summary;
      },
      error: () => {
        this.paymentSummary = null;
      }
    });
  }

  private handlePaymentRequired(err: any): boolean {
    if (err?.status !== 402) {
      return false;
    }

    this.snack.open(err?.error?.message || 'Premium is required to continue.', 'Close', { duration: 4500 });
    this.openPremium(
      err?.error?.limitType === 'MEMBER_LIMIT' ? 'member-limit' : 'workspace-limit',
      err?.error?.workspaceId
    );
    return true;
  }
}
