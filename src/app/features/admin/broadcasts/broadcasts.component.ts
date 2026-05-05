import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService } from '../../../core/services/admin.service';
import { User } from '../../../core/models/user.model';

import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-broadcasts',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule, RouterLink, MatButtonModule],
  template: `
    <div class="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="text-xs uppercase tracking-[0.22em] text-slate-400">Platform Admin</p>
          <h1 class="text-3xl font-bold text-white">Broadcast Notifications</h1>
          <p class="mt-1 text-sm text-slate-400">Send announcements to everyone or targeted user groups.</p>
        </div>
        <a routerLink="/admin" mat-flat-button color="primary" class="!rounded-xl">Back to Admin</a>
      </div>

      <div class="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <label class="grid gap-2 text-sm text-slate-600">
          Audience
          <select [(ngModel)]="audience" class="rounded-xl border border-slate-300 px-3 py-2">
            <option value="all">All active users</option>
            <option value="platform-admins">Platform admins</option>
            <option value="board-admins">Board admins</option>
            <option value="suspended">Suspended users</option>
          </select>
        </label>

        <label class="grid gap-2 text-sm text-slate-600">
          Title
          <input [(ngModel)]="title" class="rounded-xl border border-slate-300 px-3 py-2" maxlength="120">
        </label>

        <label class="grid gap-2 text-sm text-slate-600">
          Message
          <textarea [(ngModel)]="message" class="rounded-xl border border-slate-300 px-3 py-2" rows="6" maxlength="500"></textarea>
        </label>

        <button class="justify-self-start rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white" (click)="send()">
          Send Broadcast
        </button>
      </div>
    </div>
  `
})
export class BroadcastsComponent implements OnInit {
  users: User[] = [];
  audience: 'all' | 'platform-admins' | 'board-admins' | 'suspended' = 'all';
  title = '';
  message = '';

  constructor(
    private readonly adminService: AdminService,
    private readonly snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.adminService.getUsers().subscribe({
      next: (users) => this.users = users,
      error: (err) => {
        console.error('Failed to fetch users:', err);
        this.snack.open('Failed to load users for broadcasting.', 'Close', { duration: 3500 });
      }
    });
  }

  send(): void {
    const recipientIds = this.resolveAudience();
    if (!recipientIds.length || !this.title.trim() || !this.message.trim()) {
      this.snack.open('Choose an audience and fill in the title and message.', 'Close', { duration: 3500 });
      return;
    }

    this.adminService.broadcast({
      recipientIds,
      title: this.title.trim(),
      message: this.message.trim()
    }).subscribe({
      next: () => {
        this.title = '';
        this.message = '';
        this.snack.open('Broadcast sent', 'Close', { duration: 2500 });
      }
    });
  }

  private resolveAudience(): number[] {
    const isUserActive = (user: any) => user.isActive === true || user.active === true;
    
    switch (this.audience) {
      case 'platform-admins':
        return this.users.filter(user => user.role === 'PLATFORM_ADMIN' && isUserActive(user)).map(user => user.id);
      case 'board-admins':
        return this.users.filter(user => user.role === 'BOARD_ADMIN' && isUserActive(user)).map(user => user.id);
      case 'suspended':
        return this.users.filter(user => !isUserActive(user)).map(user => user.id);
      default:
        return this.users.filter(user => isUserActive(user)).map(user => user.id);
    }
  }
}
