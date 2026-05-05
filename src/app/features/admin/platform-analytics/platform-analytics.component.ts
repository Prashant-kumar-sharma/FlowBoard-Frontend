import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { AdminService, AdminStats } from '../../../core/services/admin.service';
import { User } from '../../../core/models/user.model';

import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-platform-analytics',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="text-xs uppercase tracking-[0.22em] text-slate-400">Platform Admin</p>
          <h1 class="text-3xl font-bold text-white">Platform Analytics</h1>
          <p class="mt-1 text-sm text-slate-400">
            A consolidated operational view of people, workspaces, boards, cards, and teams.
          </p>
        </div>
        <a routerLink="/admin" mat-flat-button color="primary" class="!rounded-xl">Back to Admin</a>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-sm uppercase tracking-[0.18em] text-slate-500">Total Users</p>
          <p class="mt-4 text-4xl font-semibold text-slate-900">{{ stats.totalUsers }}</p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-sm uppercase tracking-[0.18em] text-slate-500">Active Users</p>
          <p class="mt-4 text-4xl font-semibold text-emerald-700">{{ stats.activeUsers }}</p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-sm uppercase tracking-[0.18em] text-slate-500">Total Boards</p>
          <p class="mt-4 text-4xl font-semibold text-cyan-700">{{ stats.totalBoards || 0 }}</p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-sm uppercase tracking-[0.18em] text-slate-500">Total Cards</p>
          <p class="mt-4 text-4xl font-semibold text-rose-700">{{ stats.totalCards || 0 }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" *ngFor="let bucket of roleBreakdown">
          <p class="text-sm uppercase tracking-[0.18em] text-slate-500">{{ bucket.role }}</p>
          <p class="mt-4 text-4xl font-semibold text-slate-900">{{ bucket.count }}</p>
          <p class="mt-2 text-sm text-slate-500">{{ bucket.description }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-sm uppercase tracking-[0.18em] text-slate-500">Total Workspaces</p>
          <p class="mt-4 text-4xl font-semibold text-slate-900">{{ stats.totalWorkspaces || 0 }}</p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-sm uppercase tracking-[0.18em] text-slate-500">Active Teams</p>
          <p class="mt-4 text-4xl font-semibold text-slate-900">{{ stats.activeTeams || 0 }}</p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-sm uppercase tracking-[0.18em] text-slate-500">Overdue Cards</p>
          <p class="mt-4 text-4xl font-semibold text-slate-900">{{ stats.overdueCards || 0 }}</p>
        </div>
      </div>
    </div>
  `
})
export class PlatformAnalyticsComponent implements OnInit {
  stats: AdminStats = {
    totalUsers: 0,
    activeUsers: 0,
    platformAdmins: 0
  };

  suspendedUsers = 0;
  roleBreakdown: Array<{ role: User['role']; count: number; description: string }> = [
    { role: 'MEMBER', count: 0, description: 'Standard product users.' },
    { role: 'BOARD_ADMIN', count: 0, description: 'Workspace and board-level admins.' },
    { role: 'PLATFORM_ADMIN', count: 0, description: 'System-wide administrators.' }
  ];

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    forkJoin({
      stats: this.adminService.getStats(),
      users: this.adminService.getUsers(),
      workspaces: this.adminService.getAllWorkspaces(),
      boards: this.adminService.getAllBoards(),
      cards: this.adminService.getAllCards(),
      overdue: this.adminService.getOverdueCards()
    }).subscribe({
      next: ({ stats, users, workspaces, boards, cards, overdue }) => {
        this.stats = {
          ...stats,
          totalWorkspaces: workspaces.length,
          totalBoards: boards.length,
          totalCards: cards.length,
          activeTeams: workspaces.filter(workspace => (workspace.members?.length || 0) > 1).length,
          overdueCards: overdue.length
        };
        this.suspendedUsers = Math.max(stats.totalUsers - stats.activeUsers, 0);
        this.roleBreakdown = [
          {
            role: 'MEMBER',
            count: users.filter(user => user.role === 'MEMBER').length,
            description: 'Standard product users.'
          },
          {
            role: 'BOARD_ADMIN',
            count: users.filter(user => user.role === 'BOARD_ADMIN').length,
            description: 'Workspace and board-level admins.'
          },
          {
            role: 'PLATFORM_ADMIN',
            count: users.filter(user => user.role === 'PLATFORM_ADMIN').length,
            description: 'System-wide administrators.'
          }
        ];
      }
    });
  }
}
