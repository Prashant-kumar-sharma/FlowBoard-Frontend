import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService } from '../../../core/services/admin.service';
import { Workspace } from '../../../core/models/workspace.model';
import { Board } from '../../../core/models/board.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-platform-management',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatSnackBarModule, MatDialogModule, ConfirmDialogComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="text-xs uppercase tracking-[0.22em] text-slate-400">Platform Admin</p>
          <h1 class="text-3xl font-bold text-white">Workspace and Board Control</h1>
          <p class="mt-1 text-sm text-slate-400">Manage the full platform topology from one screen.</p>
        </div>
        <a routerLink="/admin" mat-flat-button color="primary" class="!rounded-xl">Back to Admin</a>
      </div>

      <section class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold text-white">Workspaces</h2>
          <span class="text-sm text-slate-400">{{ workspaces.length }} total</span>
        </div>
        <div class="grid gap-4">
          <div *ngFor="let workspace of workspaces" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div class="text-lg font-semibold text-slate-900">{{ workspace.name }}</div>
                <div class="mt-1 text-sm text-slate-500">{{ workspace.description || 'No description' }}</div>
                <div class="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span class="rounded-full bg-slate-100 px-3 py-1">#{{ workspace.id }}</span>
                  <span class="rounded-full bg-slate-100 px-3 py-1">{{ workspace.visibility }}</span>
                  <span class="rounded-full bg-slate-100 px-3 py-1">{{ workspace.members.length || 0 }} members</span>
                </div>
              </div>
              <div class="flex flex-wrap gap-2">
                <a mat-stroked-button [routerLink]="['/workspace', workspace.id]">Open</a>
                <button mat-stroked-button color="warn" (click)="deleteWorkspace(workspace)">Delete</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold text-white">Boards</h2>
          <span class="text-sm text-slate-400">{{ boards.length }} total</span>
        </div>
        <div class="grid gap-4">
          <div *ngFor="let board of boards" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div class="text-lg font-semibold text-slate-900">{{ board.name }}</div>
                <div class="mt-1 text-sm text-slate-500">{{ board.description || 'No description' }}</div>
                <div class="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span class="rounded-full bg-slate-100 px-3 py-1">Board #{{ board.id }}</span>
                  <span class="rounded-full bg-slate-100 px-3 py-1">Workspace #{{ board.workspaceId }}</span>
                  <span class="rounded-full bg-slate-100 px-3 py-1">{{ board.isClosed ? 'Closed' : 'Open' }}</span>
                </div>
              </div>
              <div class="flex flex-wrap gap-2">
                <a mat-stroked-button [routerLink]="['/board', board.id]">Open</a>
                <button mat-stroked-button *ngIf="!board.isClosed" (click)="closeBoard(board)">Close</button>
                <button mat-stroked-button color="warn" (click)="deleteBoard(board)">Delete</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `
})
export class PlatformManagementComponent implements OnInit {
  workspaces: Workspace[] = [];
  boards: Board[] = [];

  constructor(
    private adminService: AdminService,
    private snack: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  deleteWorkspace(workspace: Workspace): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Workspace',
        message: `Are you sure you want to delete "${workspace.name}"? This is an admin action and cannot be undone.`,
        confirmText: 'Delete Permanently',
        isDanger: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.adminService.deleteWorkspace(workspace.id).subscribe({
          next: () => {
            this.workspaces = this.workspaces.filter(existing => existing.id !== workspace.id);
            this.boards = this.boards.filter(board => board.workspaceId !== workspace.id);
            this.snack.open(`Deleted workspace ${workspace.name}`, 'Close', { duration: 2500 });
          }
        });
      }
    });
  }

  closeBoard(board: Board): void {
    this.adminService.closeBoard(board.id).subscribe({
      next: () => {
        this.boards = this.boards.map(existing => existing.id === board.id ? { ...existing, isClosed: true } : existing);
        this.snack.open(`Closed board ${board.name}`, 'Close', { duration: 2500 });
      }
    });
  }

  deleteBoard(board: Board): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Board',
        message: `Are you sure you want to delete board "${board.name}"?`,
        confirmText: 'Delete Board',
        isDanger: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.adminService.deleteBoard(board.id).subscribe({
          next: () => {
            this.boards = this.boards.filter(existing => existing.id !== board.id);
            this.snack.open(`Deleted board ${board.name}`, 'Close', { duration: 2500 });
          }
        });
      }
    });
  }

  private loadData(): void {
    forkJoin({
      workspaces: this.adminService.getAllWorkspaces(),
      boards: this.adminService.getAllBoards()
    }).subscribe({
      next: ({ workspaces, boards }) => {
        this.workspaces = [...workspaces].sort((a, b) => a.name.localeCompare(b.name));
        this.boards = [...boards].sort((a, b) => a.name.localeCompare(b.name));
      }
    });
  }
}
