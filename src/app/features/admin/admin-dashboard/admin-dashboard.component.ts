import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';

interface AdminDashboardStatCard {
  label: string;
  value: number;
  helper: string;
  icon: string;
  iconClass: string;
  route?: string;
}

interface AdminDashboardActionCard {
  title: string;
  description: string;
  route: string;
  icon: string;
  eyebrow: string;
  cta: string;
  surfaceClass: string;
  iconClass: string;
}

interface AdminDashboardPulseItem {
  label: string;
  value: number;
  note: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="mx-auto max-w-7xl px-4 py-8 space-y-8">
      <section class="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#09111f_0%,#0f172a_45%,#114165_100%)] px-6 py-8 text-white shadow-[0_28px_80px_rgba(15,23,42,0.25)] md:px-8 md:py-10">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.24),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.16),transparent_32%)]"></div>
        <div class="relative grid gap-8 xl:grid-cols-[minmax(0,1.65fr)_minmax(18rem,0.95fr)] xl:items-end">
          <div>
            <p class="text-xs uppercase tracking-[0.32em] text-cyan-300">Platform Admin</p>
            <h1 class="mt-4 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
              Run the platform from a dashboard that feels in control.
            </h1>
            <p class="mt-4 max-w-2xl text-sm leading-7 text-slate-200 md:text-base">
              Review platform health, step into operational tooling, and move between security, analytics, reporting,
              and communication without hunting through scattered screens.
            </p>

            <div class="mt-8 flex flex-wrap gap-3">
              <a routerLink="users" mat-flat-button class="!rounded-full !bg-cyan-400 !px-5 !py-2 !text-slate-950">
                Open User Management
              </a>
              <a routerLink="platform" mat-stroked-button class="!rounded-full !border-white/20 !px-5 !py-2 !text-white">
                Manage Workspaces
              </a>
              <a routerLink="broadcasts" mat-stroked-button class="!rounded-full !border-white/20 !px-5 !py-2 !text-white">
                Send Broadcast
              </a>
            </div>

            <div class="mt-8 grid gap-3 sm:grid-cols-3">
              <div class="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-sm">
                <div class="text-xs uppercase tracking-[0.18em] text-cyan-200">Workspaces</div>
                <div class="mt-3 text-2xl font-semibold text-white">{{ summary.totalWorkspaces }}</div>
                <div class="mt-1 text-sm text-slate-200">Platform footprint</div>
              </div>
              <div class="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-sm">
                <div class="text-xs uppercase tracking-[0.18em] text-cyan-200">Cards</div>
                <div class="mt-3 text-2xl font-semibold text-white">{{ summary.totalCards }}</div>
                <div class="mt-1 text-sm text-slate-200">Tracked work items</div>
              </div>
              <div class="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-sm">
                <div class="text-xs uppercase tracking-[0.18em] text-cyan-200">Platform Admins</div>
                <div class="mt-3 text-2xl font-semibold text-white">{{ summary.platformAdmins }}</div>
                <div class="mt-1 text-sm text-slate-200">Users with full control</div>
              </div>
            </div>
          </div>

          <div class="rounded-[1.75rem] border border-white/10 bg-white/10 p-6 backdrop-blur-md">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs uppercase tracking-[0.22em] text-cyan-200">Platform Pulse</p>
                <h2 class="mt-2 text-2xl font-semibold text-white">Today at a glance</h2>
              </div>
              <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-cyan-200">
                <mat-icon>radar</mat-icon>
              </div>
            </div>

            <div class="mt-6 space-y-3">
              <div *ngFor="let item of pulseItems" class="rounded-2xl border border-white/8 bg-slate-950/20 px-4 py-4">
                <div class="flex items-baseline justify-between gap-4">
                  <div class="text-sm font-medium text-slate-100">{{ item.label }}</div>
                  <div class="text-2xl font-semibold text-white">{{ item.value }}</div>
                </div>
                <div class="mt-1 text-sm text-slate-300">{{ item.note }}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ng-container *ngFor="let stat of statCards">
          <a *ngIf="stat.route" [routerLink]="stat.route" class="group block rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
            <div class="flex items-start justify-between gap-4">
              <div class="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">{{ stat.label }}</div>
              <div class="flex h-11 w-11 items-center justify-center rounded-2xl transition group-hover:scale-110" [ngClass]="stat.iconClass">
                <mat-icon>{{ stat.icon }}</mat-icon>
              </div>
            </div>
            <div class="mt-8 text-5xl font-semibold tracking-tight text-slate-900">{{ stat.value }}</div>
            <p class="mt-3 text-sm leading-6 text-slate-500">{{ stat.helper }}</p>
          </a>

          <article *ngIf="!stat.route" class="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <div class="flex items-start justify-between gap-4">
              <div class="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">{{ stat.label }}</div>
              <div class="flex h-11 w-11 items-center justify-center rounded-2xl" [ngClass]="stat.iconClass">
                <mat-icon>{{ stat.icon }}</mat-icon>
              </div>
            </div>
            <div class="mt-8 text-5xl font-semibold tracking-tight text-slate-900">{{ stat.value }}</div>
            <p class="mt-3 text-sm leading-6 text-slate-500">{{ stat.helper }}</p>
          </article>
        </ng-container>
      </div>

      <section class="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.95fr)]">
        <div class="rounded-[1.9rem] border border-slate-200/80 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] md:p-7">
          <div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p class="text-xs uppercase tracking-[0.22em] text-slate-500">Core Controls</p>
              <h2 class="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Run the essential admin flows</h2>
              <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                The highest-traffic admin actions are grouped here so the dashboard feels like a launchpad, not a link list.
              </p>
            </div>
          </div>

          <div class="mt-6 grid gap-4 md:grid-cols-2">
            <a
              *ngFor="let action of primaryActions"
              [routerLink]="action.route"
              class="group block rounded-[1.6rem] border p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(15,23,42,0.14)]"
              [ngClass]="action.surfaceClass"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="flex h-12 w-12 items-center justify-center rounded-2xl" [ngClass]="action.iconClass">
                  <mat-icon>{{ action.icon }}</mat-icon>
                </div>
                <span class="rounded-full border border-current/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                  {{ action.eyebrow }}
                </span>
              </div>

              <h3 class="mt-8 text-xl font-semibold tracking-tight text-slate-900">{{ action.title }}</h3>
              <p class="mt-2 text-sm leading-6 text-slate-600">{{ action.description }}</p>

              <div class="mt-6 flex items-center gap-2 text-sm font-medium text-slate-900">
                {{ action.cta }}
                <mat-icon class="!text-[18px] transition duration-200 group-hover:translate-x-1">arrow_forward</mat-icon>
              </div>
            </a>
          </div>
        </div>

        <div class="space-y-6">
          <div class="rounded-[1.9rem] border border-slate-200/80 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <p class="text-xs uppercase tracking-[0.22em] text-slate-500">Oversight</p>
            <h2 class="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Monitoring and reports</h2>
            <div class="mt-5 space-y-3">
              <a
                *ngFor="let action of secondaryActions"
                [routerLink]="action.route"
                class="group flex items-start gap-4 rounded-[1.35rem] border border-slate-200/80 px-4 py-4 transition duration-200 hover:border-slate-300 hover:bg-slate-50"
              >
                <div class="mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl" [ngClass]="action.iconClass">
                  <mat-icon>{{ action.icon }}</mat-icon>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between gap-3">
                    <div class="text-base font-semibold text-slate-900">{{ action.title }}</div>
                    <mat-icon class="!text-[18px] text-slate-400 transition duration-200 group-hover:translate-x-1">arrow_forward</mat-icon>
                  </div>
                  <div class="mt-1 text-sm leading-6 text-slate-500">{{ action.description }}</div>
                </div>
              </a>
            </div>
          </div>

          <a
            routerLink="/dashboard"
            class="group block rounded-[1.9rem] bg-slate-900 px-6 py-6 text-white shadow-[0_18px_50px_rgba(15,23,42,0.18)] transition duration-200 hover:-translate-y-0.5"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-xs uppercase tracking-[0.22em] text-cyan-300">Back To Product</p>
                <h2 class="mt-2 text-2xl font-semibold tracking-tight">Return to the member workspace view</h2>
                <p class="mt-3 max-w-lg text-sm leading-6 text-slate-300">
                  Jump back into the everyday FlowBoard experience without leaving the admin surface behind mentally.
                </p>
              </div>
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-cyan-300">
                <mat-icon>north_east</mat-icon>
              </div>
            </div>
          </a>
        </div>
      </section>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  summary = {
    totalUsers: 0,
    totalWorkspaces: 0,
    totalBoards: 0,
    totalCards: 0,
    activeTeams: 0,
    overdueCards: 0,
    platformAdmins: 0
  };

  statCards: AdminDashboardStatCard[] = [
    {
      label: 'Total Users',
      value: 0,
      helper: 'All registered accounts across the platform.',
      icon: 'groups',
      iconClass: 'bg-cyan-50 text-cyan-700'
    },
    {
      label: 'Total Workspaces',
      value: 0,
      helper: 'Every team space currently created.',
      icon: 'workspaces',
      iconClass: 'bg-indigo-50 text-indigo-700'
    },
    {
      label: 'Total Boards',
      value: 0,
      helper: 'Boards actively shaping delivery work.',
      icon: 'dashboard_customize',
      iconClass: 'bg-emerald-50 text-emerald-700'
    },
    {
      label: 'Overdue Cards',
      value: 0,
      helper: 'Items that need attention for SLA follow-through.',
      icon: 'warning_amber',
      iconClass: 'bg-amber-50 text-amber-700',
      route: 'overdue'
    }
  ];

  pulseItems: AdminDashboardPulseItem[] = [
    { label: 'Cards created', value: 0, note: 'Total cards tracked on the platform.' },
    { label: 'Active teams', value: 0, note: 'Workspaces with more than one member.' },
    { label: 'Platform admins', value: 0, note: 'People currently holding platform-wide authority.' }
  ];

  primaryActions: AdminDashboardActionCard[] = [
    {
      title: 'User Management',
      description: 'Suspend, restore, delete, and adjust platform roles from a dedicated control surface.',
      route: 'users',
      icon: 'manage_accounts',
      eyebrow: 'Accounts',
      cta: 'Open console',
      surfaceClass: 'border-cyan-200 bg-[linear-gradient(180deg,#f8fdff_0%,#eef9ff_100%)]',
      iconClass: 'bg-cyan-100 text-cyan-700'
    },
    {
      title: 'Workspace and Board Control',
      description: 'View every workspace and board, close boards that need intervention, and delete broken spaces fast.',
      route: 'platform',
      icon: 'domain',
      eyebrow: 'Operations',
      cta: 'Manage platform',
      surfaceClass: 'border-indigo-200 bg-[linear-gradient(180deg,#fbfbff_0%,#f2f4ff_100%)]',
      iconClass: 'bg-indigo-100 text-indigo-700'
    },
    {
      title: 'Platform Analytics',
      description: 'Review users, workspaces, boards, cards, team activity, and overdue load in one view.',
      route: 'analytics',
      icon: 'monitoring',
      eyebrow: 'Health',
      cta: 'View analytics',
      surfaceClass: 'border-emerald-200 bg-[linear-gradient(180deg,#fbfffd_0%,#eefbf5_100%)]',
      iconClass: 'bg-emerald-100 text-emerald-700'
    },
    {
      title: 'Broadcast Notifications',
      description: 'Send platform-wide announcements or target specific admin and account-status groups.',
      route: 'broadcasts',
      icon: 'campaign',
      eyebrow: 'Comms',
      cta: 'Send message',
      surfaceClass: 'border-amber-200 bg-[linear-gradient(180deg,#fffdf8_0%,#fff5df_100%)]',
      iconClass: 'bg-amber-100 text-amber-700'
    }
  ];

  secondaryActions: AdminDashboardActionCard[] = [
    {
      title: 'Audit Logs',
      description: 'Inspect major workspace, board, and card actions across the platform.',
      route: 'audit',
      icon: 'rule',
      eyebrow: 'Audit',
      cta: 'Open logs',
      surfaceClass: '',
      iconClass: 'bg-slate-100 text-slate-700'
    },
    {
      title: 'Activity Reports',
      description: 'Generate CSV exports for workspace-level and user-level activity reporting.',
      route: 'reports',
      icon: 'description',
      eyebrow: 'Reports',
      cta: 'Export activity',
      surfaceClass: '',
      iconClass: 'bg-rose-100 text-rose-700'
    },
    {
      title: 'Overdue Cards',
      description: 'Track SLA risk and surface the cards that need immediate follow-up.',
      route: 'overdue',
      icon: 'notification_important',
      eyebrow: 'SLA',
      cta: 'Review issues',
      surfaceClass: '',
      iconClass: 'bg-orange-100 text-orange-700'
    }
  ];

  constructor(private readonly adminService: AdminService) {}

  ngOnInit(): void {
    forkJoin({
      stats: this.adminService.getStats(),
      workspaces: this.adminService.getAllWorkspaces(),
      boards: this.adminService.getAllBoards(),
      cards: this.adminService.getAllCards(),
      overdue: this.adminService.getOverdueCards()
    }).subscribe({
      next: ({ stats, workspaces, boards, cards, overdue }) => {
        const activeTeams = workspaces.filter(workspace => (workspace.members?.length || 0) > 1).length;
        this.summary = {
          totalUsers: stats.totalUsers,
          totalWorkspaces: workspaces.length,
          totalBoards: boards.length,
          totalCards: cards.length,
          activeTeams,
          overdueCards: overdue.length,
          platformAdmins: stats.platformAdmins
        };

        this.statCards = [
          { ...this.statCards[0], value: stats.totalUsers },
          { ...this.statCards[1], value: workspaces.length },
          { ...this.statCards[2], value: boards.length },
          { ...this.statCards[3], value: overdue.length }
        ];

        this.pulseItems = [
          { label: 'Cards created', value: cards.length, note: 'Total cards tracked on the platform.' },
          { label: 'Active teams', value: activeTeams, note: 'Workspaces with more than one member.' },
          { label: 'Platform admins', value: stats.platformAdmins, note: 'People currently holding platform-wide authority.' }
        ];
      }
    });
  }
}
