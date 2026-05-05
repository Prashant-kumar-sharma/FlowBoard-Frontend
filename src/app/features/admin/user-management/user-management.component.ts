import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService } from '../../../core/services/admin.service';
import { User } from '../../../core/models/user.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatSnackBarModule, RouterLink, MatDialogModule, ConfirmDialogComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-xs uppercase tracking-[0.22em] text-slate-400">Admin Console</p>
          <h1 class="text-3xl font-bold text-white">User Management</h1>
          <p class="mt-1 text-sm text-slate-400">Manage account lifecycle and platform permissions.</p>
        </div>
        <a routerLink="/admin" mat-flat-button color="primary" class="!rounded-xl">Back to Admin</a>
      </div>

      <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table mat-table [dataSource]="users" class="w-full">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let user">
              <div class="font-medium text-slate-900">{{ user.fullName }}</div>
              <div class="text-xs text-slate-500">&#64;{{ user.username }}</div>
            </td>
          </ng-container>

          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>Email</th>
            <td mat-cell *matCellDef="let user">{{ user.email }}</td>
          </ng-container>

          <ng-container matColumnDef="role">
            <th mat-header-cell *matHeaderCellDef>Role</th>
            <td mat-cell *matCellDef="let user">{{ user.role }}</td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let user">
              <span class="rounded-full px-2 py-1 text-xs font-semibold"
                    [class.bg-emerald-50]="user.isActive"
                    [class.text-emerald-700]="user.isActive"
                    [class.bg-rose-50]="!user.isActive"
                    [class.text-rose-700]="!user.isActive">
                {{ user.isActive ? 'Active' : 'Suspended' }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let user">
              <div *ngIf="isCurrentUser(user)" class="py-2 text-sm font-medium text-slate-500">
                Current user
              </div>
              <div *ngIf="!isCurrentUser(user)" class="flex flex-wrap gap-2 py-2">
                <button mat-stroked-button color="primary" *ngIf="user.role !== 'BOARD_ADMIN'" (click)="changeRole(user, 'BOARD_ADMIN')">
                  Make Board Admin
                </button>
                <button mat-stroked-button color="primary" *ngIf="user.role !== 'PLATFORM_ADMIN'" (click)="changeRole(user, 'PLATFORM_ADMIN')">
                  Make Platform Admin
                </button>
                <button mat-stroked-button *ngIf="user.role !== 'MEMBER'" (click)="changeRole(user, 'MEMBER')">
                  Make Member
                </button>
                <button mat-stroked-button color="warn" *ngIf="user.isActive" (click)="suspend(user)">
                  Suspend
                </button>
                <button mat-stroked-button *ngIf="!user.isActive" (click)="restore(user)">
                  Restore
                </button>
                <button mat-button color="warn" (click)="remove(user)">
                  Delete
                </button>
              </div>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"></tr>
        </table>
      </div>
    </div>
  `
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  columns = ['name', 'email', 'role', 'status', 'actions'];

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private snack: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  changeRole(user: User, role: User['role']): void {
    if (this.isCurrentUser(user)) {
      this.snack.open('You cannot change your own platform role', 'Close', { duration: 2500 });
      return;
    }

    this.adminService.changeRole(user.id, role).subscribe({
      next: (updated) => {
        this.replaceUser(updated);
        this.snack.open(`Updated ${user.fullName} to ${role}`, 'Close', { duration: 2500 });
      }
    });
  }

  suspend(user: User): void {
    if (this.isCurrentUser(user)) {
      this.snack.open('You cannot suspend your own account', 'Close', { duration: 2500 });
      return;
    }

    this.adminService.suspendUser(user.id).subscribe({
      next: () => {
        this.replaceUser({ ...user, isActive: false });
        this.snack.open(`Suspended ${user.fullName}`, 'Close', { duration: 2500 });
      }
    });
  }

  restore(user: User): void {
    this.adminService.restoreUser(user.id).subscribe({
      next: () => {
        this.replaceUser({ ...user, isActive: true });
        this.snack.open(`Restored ${user.fullName}`, 'Close', { duration: 2500 });
      }
    });
  }

  remove(user: User): void {
    if (this.isCurrentUser(user)) {
      this.snack.open('You cannot delete your own account', 'Close', { duration: 2500 });
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete User',
        message: `Are you sure you want to delete ${user.fullName} permanently? This cannot be undone.`,
        confirmText: 'Delete Permanently',
        isDanger: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.adminService.deleteUser(user.id).subscribe({
          next: () => {
            this.users = this.users.filter(existing => existing.id !== user.id);
            this.snack.open(`Deleted ${user.fullName}`, 'Close', { duration: 2500 });
          }
        });
      }
    });
  }

  private loadUsers(): void {
    this.adminService.getUsers().subscribe({
      next: (users) => {
        this.users = [...users].sort((a, b) => a.fullName.localeCompare(b.fullName));
      }
    });
  }

  private replaceUser(user: User): void {
    this.users = this.users.map(existing => existing.id === user.id ? user : existing);
  }

  isCurrentUser(user: User): boolean {
    return this.authService.getCurrentUser()?.id === user.id;
  }
}
