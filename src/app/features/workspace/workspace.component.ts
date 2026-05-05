import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, forkJoin, of, takeUntil } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../core/auth/auth.service';
import { WorkspaceService } from '../../core/services/workspace.service';
import { BoardService } from '../../core/services/board.service';
import { Workspace, WorkspaceMember } from '../../core/models/workspace.model';
import { Board, CreateBoardRequest } from '../../core/models/board.model';
import { User } from '../../core/models/user.model';
import { CreateBoardDialogComponent } from '../board/create-board-dialog.component';
import { WorkspaceInviteDialogComponent, WorkspaceInviteDialogResult } from './workspace-invite-dialog.component';
import { CreateWorkspaceDialogComponent } from '../dashboard/create-workspace-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatDialogModule, MatIconModule, MatSnackBarModule],
  template: `
    <div *ngIf="workspace" class="workspace-shell min-h-screen overflow-hidden">
      <div class="workspace-glow workspace-glow-left"></div>
      <div class="workspace-glow workspace-glow-right"></div>

      <div class="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <div class="workspace-toolbar">
          <button type="button" class="workspace-back-link" (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
            Back
          </button>
        </div>

        <section class="workspace-hero rounded-[32px] px-6 py-8 text-white shadow-[0_30px_90px_rgba(15,23,42,0.22)] sm:px-8">
          <div class="grid gap-8 lg:grid-cols-[minmax(0,1.18fr)_minmax(16rem,0.82fr)] lg:items-start xl:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.78fr)]">
            <div class="workspace-hero-main min-w-0">
              <div class="workspace-hub-badge inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-sky-100">
                <span class="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.95)]"></span>
                Workspace hub
              </div>

              <div class="workspace-hero-copy">
                <div class="flex items-start gap-4">
                  <div class="workspace-mark">
                    {{ getWorkspaceInitials() }}
                  </div>
                  <div class="min-w-0">
                    <div class="text-xs uppercase tracking-[0.26em] text-sky-100/75">Workspace</div>
                    <h1 class="mt-2 text-3xl font-semibold leading-tight text-white sm:text-4xl">{{ workspace.name }}</h1>
                    <p class="mt-3 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
                      {{ workspace.description || 'A central place for related boards, members, and active delivery work.' }}
                    </p>
                  </div>
                </div>

                <div class="mt-8 flex flex-wrap gap-3" *ngIf="isLoggedIn">
                  <button mat-flat-button color="primary" class="workspace-primary-button" type="button" (click)="createBoard()">
                    <mat-icon>add_circle</mat-icon>
                    Create Board
                  </button>
                  <button mat-stroked-button class="workspace-secondary-button" type="button" (click)="editWorkspace()">
                    <mat-icon>edit</mat-icon>
                    Edit Workspace
                  </button>
                  <button
                    *ngIf="canManageMembers"
                    mat-stroked-button
                    class="workspace-secondary-button"
                    type="button"
                    (click)="openInviteDialog()"
                  >
                    <mat-icon>person_add</mat-icon>
                    Invite Members
                  </button>
                  <a mat-stroked-button routerLink="/dashboard" class="workspace-secondary-button">
                    <mat-icon>apps</mat-icon>
                    All Workspaces
                  </a>
                  <button mat-stroked-button type="button" class="workspace-danger-button" (click)="deleteWorkspace()">
                    <mat-icon>delete</mat-icon>
                    Delete Workspace
                  </button>
                </div>

                <div class="mt-8 flex flex-wrap gap-4" *ngIf="!isLoggedIn">
                  <a mat-flat-button color="primary" routerLink="/auth/register" class="guest-cta-primary">
                    <mat-icon>rocket_launch</mat-icon>
                    <span>Join FlowBoard</span>
                  </a>
                  <a mat-stroked-button routerLink="/auth/login" class="guest-cta-secondary">
                    <mat-icon>login</mat-icon>
                    <span>Log in to Collaborate</span>
                  </a>
                </div>
              </div>
            </div>

            <div class="min-w-0 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <article class="workspace-metric">
                <p class="workspace-metric-label">Boards</p>
                <p class="workspace-metric-value">{{ boards.length }}</p>
                <p class="workspace-metric-copy">Live planning spaces available for this workspace.</p>
              </article>
              <article class="workspace-metric">
                <p class="workspace-metric-label">Members</p>
                <p class="workspace-metric-value">{{ workspace.members.length }}</p>
                <p class="workspace-metric-copy">People collaborating inside this shared area.</p>
              </article>
              <article class="workspace-metric">
                <p class="workspace-metric-label">Visibility</p>
                <p class="workspace-metric-value text-2xl sm:text-3xl">{{ workspace.visibility === 'PUBLIC' ? 'Shared' : 'Private' }}</p>
                <p class="workspace-metric-copy">Access model for boards and membership activity.</p>
              </article>
            </div>
          </div>
        </section>

        <section class="rounded-[30px] border border-slate-200/80 bg-white/88 p-4 shadow-[0_22px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-5">
          <div class="section-switcher">
            <button
              type="button"
              class="section-switch"
              [class.is-active]="activeSection === 'boards'"
              (click)="activeSection = 'boards'"
            >
              <mat-icon>dashboard</mat-icon>
              Boards
            </button>
            <button
              type="button"
              class="section-switch"
              [class.is-active]="activeSection === 'members'"
              (click)="activeSection = 'members'"
            >
              <mat-icon>groups</mat-icon>
              Members
            </button>
          </div>

          <div *ngIf="activeSection === 'boards'" class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <article
              *ngFor="let board of boards; trackBy: trackByBoard"
              class="workspace-board-card rounded-[24px] p-5 text-white shadow-[0_18px_45px_rgba(15,23,42,0.2)]"
              [style.background]="board.background"
            >
              <div class="workspace-board-overlay"></div>
              <div class="relative flex min-h-[220px] flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between gap-3">
                    <p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/72">Board</p>
                    <span class="workspace-board-status">{{ board.visibility === 'PUBLIC' ? 'Shared' : 'Private' }}</span>
                  </div>
                  <h2 class="mt-4 text-2xl font-semibold leading-tight">{{ board.name }}</h2>
                  <p class="mt-3 text-sm leading-6 text-white/82">
                    {{ board.description || 'A focused surface for tasks, delivery updates, and team coordination.' }}
                  </p>
                </div>

                <div class="mt-6 flex flex-wrap items-center gap-2">
                  <a [routerLink]="['/board', board.id]" class="workspace-board-link">
                    <span>View board</span>
                    <mat-icon class="!text-base">visibility</mat-icon>
                  </a>
                  <button
                    *ngIf="isLoggedIn"
                    mat-stroked-button
                    type="button"
                    class="workspace-board-delete"
                    (click)="editBoard(board, $event)"
                  >
                    Edit
                  </button>
                  <button
                    *ngIf="isLoggedIn"
                    mat-stroked-button
                    type="button"
                    class="workspace-board-delete"
                    (click)="deleteBoard(board, $event)"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>

            <button *ngIf="isLoggedIn" mat-stroked-button class="create-board-panel" (click)="createBoard()">
              <span class="create-board-badge">
                <mat-icon>add</mat-icon>
              </span>
              <span class="block text-left">
                <span class="block text-lg font-semibold text-slate-900">Create a new board</span>
                <span class="mt-2 block text-sm leading-6 text-slate-600">
                  Start another execution lane for launches, sprints, or focused team work.
                </span>
              </span>
            </button>
          </div>

          <div *ngIf="activeSection === 'members'" class="mt-5">
            <div *ngIf="!isLoggedIn" class="guest-login-wall rounded-[26px] p-12 text-center">
              <div class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <mat-icon class="!h-8 !w-8 !text-[32px]">lock</mat-icon>
              </div>
              <h2 class="text-2xl font-bold text-slate-900">Sign in to see the team</h2>
              <p class="mx-auto mt-3 max-w-sm text-slate-600">
                Member lists and workspace activity are restricted to registered users for security and privacy.
              </p>
              <div class="mt-8 flex justify-center gap-4">
                <a mat-flat-button color="primary" routerLink="/auth/login" class="workspace-primary-button">Log In</a>
                <a mat-stroked-button routerLink="/auth/register" class="workspace-secondary-button !border-slate-300 !text-slate-700">Create Account</a>
              </div>
            </div>

            <div *ngIf="isLoggedIn" class="grid gap-4 lg:grid-cols-[0.95fr,1.25fr]">
              <article class="member-summary-card rounded-[26px] p-6">
                <p class="text-xs font-semibold uppercase tracking-[0.26em] text-sky-700/70">Team snapshot</p>
                <h2 class="mt-3 text-2xl font-semibold text-slate-900">{{ workspace.members.length }} people in this workspace</h2>
                <p class="mt-3 text-sm leading-7 text-slate-600">
                  Keep the right people close to the work. Owners and admins can invite teammates and shape access as the workspace grows.
                </p>

                <div class="mt-6 grid gap-3">
                  <div class="member-summary-chip">
                    <mat-icon>workspace_premium</mat-icon>
                    Owner: {{ getMemberUsername(workspace.ownerId) }}
                  </div>
                  <div class="member-summary-chip">
                    <mat-icon>shield</mat-icon>
                    {{ adminCount }} admins helping manage collaboration
                  </div>
                  <div class="member-summary-chip">
                    <mat-icon>{{ workspace.visibility === 'PUBLIC' ? 'public' : 'lock' }}</mat-icon>
                    {{ workspace.visibility === 'PUBLIC' ? 'Public workspace' : 'Private workspace' }}
                  </div>
                </div>

                <button
                  *ngIf="canManageMembers"
                  mat-flat-button
                  color="primary"
                  class="workspace-primary-button mt-8"
                  type="button"
                  (click)="openInviteDialog()"
                >
                  <mat-icon>person_add</mat-icon>
                  Invite another member
                </button>
              </article>

              <div class="grid gap-3">
                <article *ngFor="let m of workspace.members; trackBy: trackByMember" class="member-card rounded-[22px] p-4">
                  <div class="flex items-start gap-4">
                    <div class="member-avatar">
                      {{ getMemberInitials(m.userId) }}
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="flex flex-wrap items-center gap-2">
                        <h3 class="text-base font-semibold text-slate-900">{{ getMemberUsername(m.userId) }}</h3>
                        <span *ngIf="workspace.ownerId === m.userId" class="member-chip member-chip-owner">Owner</span>
                        <span *ngIf="workspace.ownerId !== m.userId" class="member-chip">{{ m.role }}</span>
                      </div>
                      <p class="mt-2 text-sm leading-6 text-slate-600">
                        <span class="font-medium text-slate-700">{{ getMemberFullName(m.userId) }}</span>
                        joined {{ m.joinedAt | date:'MMM d, y' }} and currently contributes as {{ m.role.toLowerCase() }}.
                      </p>
                    </div>
                    <div class="member-actions" *ngIf="canManageMembers && workspace.ownerId !== m.userId">
                      <button
                        *ngIf="canChangeMemberRole(m)"
                        mat-stroked-button
                        type="button"
                        class="member-role-button"
                        (click)="changeMemberRole(m)"
                      >
                        {{ m.role === 'ADMIN' ? 'Set as Member' : 'Make Admin' }}
                      </button>
                      <button
                        *ngIf="canRemoveMember(m.userId)"
                        mat-stroked-button
                        type="button"
                        class="member-remove-button"
                        (click)="removeMember(m.userId)"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .workspace-shell {
      position: relative;
      background:
        radial-gradient(circle at top left, rgba(14, 165, 233, 0.15), transparent 24rem),
        radial-gradient(circle at 90% 10%, rgba(59, 130, 246, 0.14), transparent 24rem),
        linear-gradient(180deg, #f8fbff 0%, #eef4fb 48%, #f7f9fc 100%);
    }

    .workspace-glow {
      position: absolute;
      width: 18rem;
      height: 18rem;
      border-radius: 9999px;
      filter: blur(54px);
      opacity: 0.34;
      pointer-events: none;
    }

    .workspace-glow-left {
      top: 4rem;
      left: -4rem;
      background: rgba(14, 165, 233, 0.42);
    }

    .workspace-glow-right {
      top: 12rem;
      right: -4rem;
      background: rgba(59, 130, 246, 0.22);
    }

    .workspace-hero {
      position: relative;
      overflow: hidden;
      background:
        radial-gradient(circle at top right, rgba(125, 211, 252, 0.18), transparent 18rem),
        linear-gradient(135deg, #0f172a 0%, #155e75 54%, #0369a1 100%);
    }

    .workspace-hero::after {
      content: '';
      position: absolute;
      inset: 0;
      background:
        linear-gradient(120deg, rgba(255, 255, 255, 0.12), transparent 35%),
        repeating-linear-gradient(
          120deg,
          rgba(255, 255, 255, 0.04) 0,
          rgba(255, 255, 255, 0.04) 1px,
          transparent 1px,
          transparent 18px
        );
      pointer-events: none;
    }

    .workspace-toolbar {
      display: flex;
      align-items: center;
    }

    .workspace-mark {
      display: flex;
      height: 4.6rem;
      width: 4.6rem;
      align-items: center;
      justify-content: center;
      border-radius: 1.5rem;
      background: linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.06));
      border: 1px solid rgba(255,255,255,0.18);
      font-size: 1.55rem;
      font-weight: 700;
      box-shadow: 0 18px 36px rgba(15, 23, 42, 0.24);
      text-transform: uppercase;
    }

    .workspace-hero-main {
      display: flex;
      min-height: 100%;
      flex-direction: column;
    }

    .workspace-hub-badge {
      align-self: flex-start;
    }

    .workspace-hero-copy {
      margin-top: auto;
      padding-top: 5.5rem;
      padding-bottom: 0.35rem;
    }

    .workspace-back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.55rem;
      border: 1px solid rgba(148, 163, 184, 0.22);
      border-radius: 9999px;
      padding: 0.7rem 1rem;
      background: rgba(255, 255, 255, 0.78);
      color: #334155;
      font-size: 0.92rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      cursor: pointer;
      box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
      transition: border-color 180ms ease, color 180ms ease, transform 180ms ease, background-color 180ms ease;
    }

    .workspace-back-link:hover {
      border-color: rgba(2, 132, 199, 0.32);
      background: rgba(255, 255, 255, 0.96);
      color: #0f172a;
      transform: translateX(-2px);
    }

    .workspace-metric {
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 1.5rem;
      background: rgba(255, 255, 255, 0.08);
      padding: 1.25rem;
      backdrop-filter: blur(14px);
    }

    .workspace-metric-label {
      margin: 0;
      font-size: 0.72rem;
      letter-spacing: 0.24em;
      text-transform: uppercase;
      color: rgba(224, 242, 254, 0.72);
    }

    .workspace-metric-value {
      margin: 0.7rem 0 0;
      font-size: clamp(2rem, 3vw, 2.55rem);
      font-weight: 700;
      line-height: 1.05;
      color: white;
    }

    .workspace-metric-copy {
      margin: 0.75rem 0 0;
      font-size: 0.92rem;
      line-height: 1.55;
      color: rgba(226, 232, 240, 0.82);
    }

    .section-switcher {
      display: inline-grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.35rem;
      padding: 0.35rem;
      border-radius: 9999px;
      background: linear-gradient(180deg, rgba(226, 232, 240, 0.7), rgba(248, 250, 252, 0.98));
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.86);
    }

    .section-switch {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.55rem;
      min-height: 2.9rem;
      min-width: 9rem;
      border: 0;
      border-radius: 9999px;
      background: transparent;
      color: #475569;
      font-size: 0.95rem;
      font-weight: 700;
      transition: all 180ms ease;
    }

    .section-switch.is-active {
      background: linear-gradient(135deg, #0369a1, #0f172a);
      color: white;
      box-shadow: 0 14px 28px rgba(15, 23, 42, 0.16);
    }

    .workspace-board-card {
      position: relative;
      overflow: hidden;
      transition: transform 220ms ease, box-shadow 220ms ease;
    }

    .workspace-board-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 24px 56px rgba(15, 23, 42, 0.22);
    }

    .workspace-board-overlay {
      position: absolute;
      inset: 0;
      background:
        linear-gradient(180deg, rgba(15, 23, 42, 0.04), rgba(15, 23, 42, 0.62)),
        radial-gradient(circle at top left, rgba(255,255,255,0.28), transparent 42%);
    }

    .workspace-board-status,
    .member-chip,
    .member-summary-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      border-radius: 9999px;
      font-size: 0.78rem;
      font-weight: 700;
      line-height: 1;
    }

    .workspace-board-status {
      border: 1px solid rgba(255,255,255,0.2);
      background: rgba(255,255,255,0.1);
      padding: 0.58rem 0.8rem;
      color: rgba(255,255,255,0.88);
    }

    .workspace-board-link {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      border-radius: 9999px;
      border: 1px solid rgba(255,255,255,0.25);
      background: rgba(255,255,255,0.12);
      padding: 0.7rem 1rem;
      color: white;
      text-decoration: none;
      font-size: 0.92rem;
      font-weight: 600;
    }

    .workspace-board-delete,
    .workspace-danger-button,
    .member-remove-button,
    .member-role-button {
      border-radius: 9999px;
    }

    .workspace-board-delete {
      border-color: rgba(255,255,255,0.24) !important;
      color: white !important;
      background: rgba(15, 23, 42, 0.12) !important;
    }

    .create-board-panel {
      min-height: 220px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      border-radius: 1.5rem;
      border-style: dashed !important;
      border-color: rgba(14, 165, 233, 0.28) !important;
      background: linear-gradient(180deg, rgba(255,255,255,0.88), rgba(240,249,255,0.96));
      padding: 1.5rem;
      text-align: left;
      transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
    }

    .create-board-panel:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 50px rgba(14, 165, 233, 0.12);
      border-color: rgba(2, 132, 199, 0.42) !important;
    }

    .create-board-badge {
      display: inline-flex;
      height: 3.2rem;
      width: 3.2rem;
      align-items: center;
      justify-content: center;
      border-radius: 1rem;
      background: linear-gradient(135deg, rgba(14,165,233,0.16), rgba(2,132,199,0.28));
      color: #0369a1;
    }

    .member-summary-card {
      border: 1px solid rgba(148, 163, 184, 0.16);
      background:
        linear-gradient(180deg, rgba(240,249,255,0.95), rgba(255,255,255,0.95)),
        linear-gradient(135deg, rgba(14,165,233,0.14), transparent 45%);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.7);
    }

    .member-summary-chip {
      border: 1px solid rgba(148, 163, 184, 0.18);
      background: rgba(255,255,255,0.78);
      padding: 0.85rem 1rem;
      color: #334155;
    }

    .member-card {
      border: 1px solid rgba(148, 163, 184, 0.14);
      background: rgba(255,255,255,0.88);
      box-shadow: 0 14px 40px rgba(15, 23, 42, 0.05);
    }

    .member-avatar {
      display: flex;
      height: 3rem;
      width: 3rem;
      align-items: center;
      justify-content: center;
      border-radius: 1rem;
      background: linear-gradient(135deg, #0284c7, #0f172a);
      color: white;
      font-size: 0.9rem;
      font-weight: 700;
      box-shadow: 0 14px 30px rgba(3, 105, 161, 0.22);
    }

    .member-chip {
      background: #e2e8f0;
      color: #334155;
      padding: 0.46rem 0.7rem;
    }

    .member-chip-owner {
      background: #fef3c7;
      color: #92400e;
    }

    .workspace-primary-button,
    .workspace-secondary-button {
      border-radius: 9999px;
    }

    .workspace-primary-button {
      box-shadow: 0 18px 35px rgba(2,132,199,0.24);
    }

    .workspace-secondary-button {
      border-color: rgba(255,255,255,0.2) !important;
      background: rgba(255,255,255,0.08) !important;
      color: white !important;
    }

    .workspace-danger-button {
      border-color: rgba(248,113,113,0.28) !important;
      background: rgba(127,29,29,0.18) !important;
      color: #fee2e2 !important;
    }

    .member-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 0.5rem;
    }

    .member-role-button {
      border-color: rgba(2, 132, 199, 0.22) !important;
      color: #0369a1 !important;
      background: rgba(240, 249, 255, 0.88) !important;
    }

    .member-remove-button {
      border-color: rgba(248,113,113,0.24) !important;
      color: #b91c1c !important;
    }

    .guest-login-wall {
      background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(248,250,252,0.95));
      border: 1px dashed #cbd5e1;
      box-shadow: 0 20px 50px rgba(15,23,42,0.06);
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
      box-shadow: 0 12px 30px rgba(255,255,255,0.2) !important;
    }

    .guest-cta-secondary {
      border: 1px solid rgba(255,255,255,0.3) !important;
      background: rgba(255,255,255,0.08) !important;
      color: #ffffff !important;
      backdrop-filter: blur(8px) !important;
    }

    .guest-cta-primary mat-icon, .guest-cta-secondary mat-icon, mat-icon {
      font-family: 'Material Icons' !important;
      font-feature-settings: 'liga' !important;
    }
  `]
})
export class WorkspaceComponent implements OnInit, OnDestroy {
  workspace: Workspace | null = null;
  boards: Board[] = [];
  activeSection: 'boards' | 'members' = 'boards';
  memberDirectory: Record<number, User> = {};
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private workspaceService: WorkspaceService,
    private boardService: BoardService,
    private authService: AuthService,
    private dialog: MatDialog,
    private router: Router,
    private snack: MatSnackBar,
    private location: Location
  ) {}

  get canManageMembers(): boolean {
    if (!this.workspace || !this.isLoggedIn) {
      return false;
    }

    const currentUserId = this.authService.getCurrentUser()?.id;
    if (!currentUserId) {
      return false;
    }

    return this.workspace.ownerId === currentUserId ||
      this.workspace.members.some(member => member.userId === currentUserId && member.role === 'ADMIN');
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = +params['id'];
      this.workspace = null;
      this.boards = [];
      this.memberDirectory = {};
      this.activeSection = 'boards';
      this.workspaceService.getById(id).subscribe(ws => {
        this.workspace = ws;
        this.loadMemberDirectory(ws);
        this.boardService.getByWorkspace(id).subscribe(b => this.boards = b);
      });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createBoard(): void {
    if (!this.workspace) {
      return;
    }

    const dialogRef = this.dialog.open(CreateBoardDialogComponent, {
      autoFocus: false,
      maxWidth: '95vw',
      data: { workspaceId: this.workspace.id },
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

  editWorkspace(): void {
    if (!this.workspace) {
      return;
    }

    const dialogRef = this.dialog.open(CreateWorkspaceDialogComponent, {
      autoFocus: false,
      maxWidth: '95vw',
      data: { mode: 'edit', workspace: this.workspace },
    });

    dialogRef.afterClosed().subscribe((payload?: { name: string; description?: string; visibility?: 'PUBLIC' | 'PRIVATE' }) => {
      if (!payload || !this.workspace) {
        return;
      }

      this.workspaceService.update(this.workspace.id, payload).subscribe({
        next: (workspace) => {
          this.workspace = { ...this.workspace, ...workspace, members: this.workspace!.members };
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

  deleteWorkspace(): void {
    if (!this.workspace) return;
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Workspace',
        message: `Are you sure you want to delete "${this.workspace.name}"? This action is permanent and all boards inside will be lost.`,
        confirmText: 'Delete Workspace',
        isDanger: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.workspaceService.delete(this.workspace!.id).subscribe({
          next: () => {
            this.snack.open('Workspace deleted', 'Close', { duration: 2500 });
            this.router.navigate(['/dashboard']);
          },
          error: (err) => {
            const message = err?.error?.message || err?.message || 'Failed to delete workspace';
            this.snack.open(message, 'Close', { duration: 4500 });
          }
        });
      }
    });
  }

  openInviteDialog(): void {
    if (!this.workspace || !this.canManageMembers) {
      return;
    }

    const dialogRef = this.dialog.open(WorkspaceInviteDialogComponent, {
      autoFocus: false,
      maxWidth: '95vw',
      data: {
        currentUserId: this.authService.getCurrentUser()?.id ?? null,
        existingMemberIds: this.workspace.members.map(member => member.userId),
      },
    });

    dialogRef.afterClosed().subscribe((result?: WorkspaceInviteDialogResult) => {
      if (!result || !this.workspace) {
        return;
      }

      this.workspaceService.addMember(this.workspace.id, result.user.id, result.role).subscribe({
        next: (member) => {
          if (!this.workspace) {
            return;
          }

          this.workspace = {
            ...this.workspace,
            members: [...this.workspace.members, member].sort((a, b) => a.userId - b.userId),
          };
          this.loadMemberProfile(result.user.id);
          this.snack.open(`${result.user.fullName} added to workspace`, 'Close', { duration: 3000 });
        },
        error: (err) => {
          if (this.handlePaymentRequired(err)) {
            return;
          }
          const message =
            err?.error?.message ||
            err?.message ||
            `Failed to invite member${err?.status ? ` (${err.status})` : ''}`;
          this.snack.open(message, 'Close', { duration: 4500 });
        }
      });
    });
  }

  canRemoveMember(userId: number): boolean {
    if (!this.workspace || !this.canManageMembers) {
      return false;
    }

    return userId !== this.workspace.ownerId;
  }

  canChangeMemberRole(member: WorkspaceMember): boolean {
    if (!this.workspace || !this.canManageMembers) {
      return false;
    }

    const currentUserId = this.authService.getCurrentUser()?.id;
    return member.userId !== this.workspace.ownerId && member.userId !== currentUserId;
  }

  changeMemberRole(member: WorkspaceMember): void {
    if (!this.workspace || !this.canChangeMemberRole(member)) {
      return;
    }

    const nextRole: WorkspaceMember['role'] = member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN';
    const actionLabel = nextRole === 'ADMIN' ? 'promote' : 'set as member';
    const memberName = this.getMemberDisplayName(member.userId);

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Change Member Role',
        message: `Set ${memberName} as a ${nextRole.toLowerCase()}?`,
        confirmText: 'Change Role'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.workspaceService.updateMemberRole(this.workspace!.id, member.userId, nextRole).subscribe({
          next: () => {
            if (!this.workspace) return;
            this.workspace = {
              ...this.workspace,
              members: this.workspace.members.map(existing =>
                existing.userId === member.userId ? { ...existing, role: nextRole } : existing
              ),
            };
            this.snack.open(`${memberName} is now ${nextRole.toLowerCase()}`, 'Close', { duration: 3000 });
          },
          error: (err) => {
            const message = err?.error?.message || err?.message || 'Failed to update member role';
            this.snack.open(message, 'Close', { duration: 4500 });
          }
        });
      }
    });
  }

  removeMember(userId: number): void {
    if (!this.workspace || !this.canRemoveMember(userId)) return;
    const memberName = this.getMemberDisplayName(userId);

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Remove Member',
        message: `Are you sure you want to remove ${memberName} from this workspace?`,
        confirmText: 'Remove',
        isDanger: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.workspaceService.removeMember(this.workspace!.id, userId).subscribe({
          next: () => {
            if (!this.workspace) return;
            this.workspace = {
              ...this.workspace,
              members: this.workspace.members.filter(member => member.userId !== userId),
            };
            this.snack.open(`${memberName} removed from workspace`, 'Close', { duration: 3000 });
          },
          error: (err) => {
            const message = err?.error?.message || err?.message || 'Failed to remove member';
            this.snack.open(message, 'Close', { duration: 4500 });
          }
        });
      }
    });
  }

  get adminCount(): number {
    return this.workspace?.members.filter(member => member.role === 'ADMIN').length ?? 0;
  }

  getWorkspaceInitials(): string {
    return this.workspace?.name
      ?.match(/[a-zA-Z0-9]+/g)
      ?.slice(0, 2)
      ?.map(part => part.charAt(0).toUpperCase())
      ?.join('') || 'WS';
  }

  getMemberUsername(userId: number): string {
    const user = this.memberDirectory[userId];
    if (!user) {
      return `User #${userId}`;
    }

    return user.username || user.fullName || `User #${userId}`;
  }

  getMemberFullName(userId: number): string {
    const user = this.memberDirectory[userId];
    return user?.username || user?.fullName || `User #${userId}`;
  }

  getMemberInitials(userId: number): string {
    const user = this.memberDirectory[userId];
    if (!user) {
      return `U${String(userId).slice(-2).padStart(2, '0')}`;
    }

    return user.fullName
      ?.match(/[a-zA-Z0-9]+/g)
      ?.slice(0, 2)
      ?.map(part => part.charAt(0).toUpperCase())
      ?.join('') || 'U';
  }

  private loadMemberDirectory(workspace: Workspace): void {
    const userIds = Array.from(new Set([workspace.ownerId, ...(workspace.members || []).map(member => member.userId)]));
    const currentUser = this.authService.getCurrentUser();

    if (currentUser) {
      this.memberDirectory[currentUser.id] = currentUser;
    }

    const requests = userIds
      .filter(userId => !this.memberDirectory[userId])
      .map(userId => this.authService.getUserById(userId).pipe(catchError(() => of(null))));

    if (!requests.length) {
      return;
    }

    forkJoin(requests).subscribe(users => {
      const nextDirectory = { ...this.memberDirectory };

      users
        .filter((user): user is User => !!user)
        .forEach(user => {
          nextDirectory[user.id] = user;
        });

      this.memberDirectory = nextDirectory;
    });
  }

  private loadMemberProfile(userId: number): void {
    if (this.memberDirectory[userId]) {
      return;
    }

    this.authService.getUserById(userId).pipe(
      catchError(() => of(null))
    ).subscribe(user => {
      if (user) {
        this.memberDirectory = {
          ...this.memberDirectory,
          [user.id]: user,
        };
      }
    });
  }

  private getMemberDisplayName(userId: number): string {
    const user = this.memberDirectory[userId];
    return user?.username || user?.fullName || `User #${userId}`;
  }

  trackByBoard(_: number, board: Board): number {
    return board.id;
  }

  trackByMember(_: number, member: Workspace['members'][number]): number {
    return member.id;
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    this.router.navigate(['/dashboard']);
  }

  openPremium(reason?: string, workspaceId?: number): void {
    this.router.navigate(['/billing/premium'], {
      queryParams: {
        ...(reason ? { reason } : {}),
        ...(workspaceId ? { workspaceId } : {}),
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
      err?.error?.workspaceId || this.workspace?.id
    );
    return true;
  }
}
