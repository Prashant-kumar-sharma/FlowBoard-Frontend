import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/auth/auth.service';
import { User } from '../../core/models/user.model';

export interface WorkspaceInviteDialogData {
  currentUserId: number | null;
  existingMemberIds: number[];
}

export interface WorkspaceInviteDialogResult {
  user: User;
  role: 'ADMIN' | 'MEMBER';
}

@Component({
  selector: 'app-workspace-invite-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title class="text-xl font-semibold">Invite Members</h2>

    <form [formGroup]="form" (ngSubmit)="search()">
      <mat-dialog-content class="w-[min(92vw,36rem)] pt-2">
        <div class="grid gap-4">
          <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_9rem_auto] sm:items-start">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Name or username</mat-label>
              <input matInput formControlName="query" maxlength="80" placeholder="Search teammates">
              <mat-error *ngIf="form.controls.query.hasError('required')">
                Search text is required
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Role</mat-label>
              <mat-select formControlName="role">
                <mat-option value="MEMBER">Member</mat-option>
                <mat-option value="ADMIN">Admin</mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-flat-button color="primary" type="submit" class="sm:mt-1" [disabled]="form.invalid || loading">
              Search
            </button>
          </div>

          <div *ngIf="loading" class="flex justify-center py-6">
            <mat-spinner diameter="28"></mat-spinner>
          </div>

          <p *ngIf="!loading && searched && results.length === 0" class="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
            No matching users found.
          </p>

          <div *ngIf="errorMessage" class="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {{ errorMessage }}
          </div>

          <div class="space-y-2" *ngIf="results.length">
            <button
              *ngFor="let user of results"
              type="button"
              class="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left transition hover:border-primary/40 hover:bg-slate-50"
              (click)="selectUser(user)"
            >
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light text-sm font-bold text-primary">
                {{ user.fullName[0] }}
              </div>
              <div class="min-w-0 flex-1">
                <div class="truncate font-medium text-slate-800">{{ user.fullName }}</div>
                <div class="truncate text-sm text-slate-500">
                  <span>&#64;</span>{{ user.username }} • {{ user.email }}
                </div>
              </div>
              <span class="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                Invite
              </span>
            </button>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="dialogRef.close()">Cancel</button>
      </mat-dialog-actions>
    </form>
  `
})
export class WorkspaceInviteDialogComponent {
  readonly form = this.fb.group({
    query: ['', [Validators.required, Validators.maxLength(80)]],
    role: ['MEMBER' as 'ADMIN' | 'MEMBER', Validators.required],
  });

  loading = false;
  searched = false;
  errorMessage = '';
  results: User[] = [];

  constructor(
    private fb: NonNullableFormBuilder,
    private authService: AuthService,
    public dialogRef: MatDialogRef<WorkspaceInviteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: WorkspaceInviteDialogData
  ) {}

  search(): void {
    if (this.form.invalid) {
      return;
    }

    const query = this.form.controls.query.getRawValue().trim();
    if (!query) {
      this.results = [];
      return;
    }

    this.loading = true;
    this.searched = true;
    this.errorMessage = '';

    this.authService.searchUsers(query).subscribe({
      next: (users) => {
        const existingIds = new Set(this.data.existingMemberIds);
        this.results = users.filter(user =>
          user.id !== this.data.currentUserId &&
          user.isActive &&
          !existingIds.has(user.id)
        );
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.results = [];
        this.errorMessage =
          err?.error?.message ||
          err?.message ||
          `Failed to search users${err?.status ? ` (${err.status})` : ''}`;
      }
    });
  }

  selectUser(user: User): void {
    this.dialogRef.close({
      user,
      role: this.form.controls.role.getRawValue(),
    } satisfies WorkspaceInviteDialogResult);
  }
}
