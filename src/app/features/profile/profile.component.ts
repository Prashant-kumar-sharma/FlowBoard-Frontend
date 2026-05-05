import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth/auth.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="profile-shell min-h-screen overflow-hidden" *ngIf="user">
      <div class="profile-glow profile-glow-left"></div>
      <div class="profile-glow profile-glow-right"></div>

      <div class="relative mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section class="rounded-[32px] border border-slate-200/80 bg-white/86 px-6 py-7 shadow-[0_22px_65px_rgba(15,23,42,0.08)] backdrop-blur sm:px-8">
          <div class="flex flex-col gap-5">
            <div class="flex items-center justify-between gap-3">
              <a
                mat-stroked-button
                routerLink="/dashboard"
                class="inline-flex items-center gap-2 rounded-full !border-slate-300 !bg-white/80 !px-4 !py-2 !text-slate-700 shadow-sm backdrop-blur-sm hover:!bg-white"
              >
                <mat-icon>arrow_back</mat-icon>
                Back
              </a>

              <div class="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-slate-600 sm:block">
                Personal Space
              </div>
            </div>

            <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div class="min-w-0">
                <p class="m-0 text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-slate-500">Profile center</p>
                <h1 class="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Your FlowBoard identity</h1>
                <p class="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                  Keep your name, handle, avatar, and bio polished so teammates recognize you instantly across boards and workspaces.
                </p>
              </div>

              <div class="grid min-w-[13rem] gap-2 rounded-[1.5rem] border border-slate-200 bg-white/92 px-4 py-3 text-slate-900 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur-sm">
                <p class="m-0 text-xs uppercase tracking-[0.24em] text-slate-500">Signed in as</p>
                <p class="m-0 truncate text-lg font-semibold">{{ user.fullName }}</p>
                <p class="m-0 truncate text-sm text-slate-600">&#64;{{ user.username }}</p>
              </div>
            </div>
          </div>
        </section>

        <div class="grid gap-6 md:grid-cols-[18rem_minmax(0,1fr)]">
        <mat-card class="rounded-3xl border border-slate-200/80 bg-white/92 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm">
          <div class="p-6 text-center">
            <div
              class="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-slate-900 text-3xl font-bold text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]"
              [style.background-image]="getAvatarBackgroundImage(user.avatarUrl)"
            >
              <span *ngIf="!user.avatarUrl">{{ initials }}</span>
            </div>
            <h1 class="mt-4 text-2xl font-semibold text-slate-900">{{ user.fullName }}</h1>
            <p class="mt-1 text-sm text-slate-500">&#64;{{ user.username }}</p>
            <p class="mt-2 text-sm text-slate-500">{{ user.email }}</p>
            <div class="mt-4 inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
              {{ user.role }}
            </div>
            <p class="mt-4 text-sm text-slate-600" *ngIf="user.bio; else noBio">{{ user.bio }}</p>
            <ng-template #noBio>
              <p class="mt-4 text-sm text-slate-400">No bio added yet.</p>
            </ng-template>
          </div>
        </mat-card>

        <mat-card class="rounded-3xl border border-slate-200/80 bg-white/94 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm">
          <div class="p-6">
            <h2 class="text-xl font-semibold text-slate-900">Profile Details</h2>
            <p class="mt-1 text-sm text-slate-500">Update how your profile appears across FlowBoard.</p>

            <form [formGroup]="form" (ngSubmit)="save()" class="mt-6 grid gap-4">
              <mat-form-field appearance="outline">
                <mat-label>Full name</mat-label>
                <input matInput formControlName="fullName">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Username</mat-label>
                <input matInput formControlName="username">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Avatar URL</mat-label>
                <input matInput formControlName="avatarUrl" placeholder="https://example.com/avatar.png">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Bio</mat-label>
                <textarea matInput rows="4" formControlName="bio" placeholder="Tell your team a little about yourself"></textarea>
              </mat-form-field>

              <div class="flex justify-end">
                <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving">
                  {{ saving ? 'Saving...' : 'Save Profile' }}
                </button>
              </div>
            </form>
          </div>
        </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-shell {
      position: relative;
      background:
        radial-gradient(circle at top left, rgba(14, 165, 233, 0.14), transparent 28rem),
        radial-gradient(circle at 85% 10%, rgba(59, 130, 246, 0.18), transparent 24rem),
        linear-gradient(180deg, #f8fbff 0%, #eef4fb 48%, #f7f9fc 100%);
    }

    .profile-glow {
      pointer-events: none;
      position: absolute;
      width: 20rem;
      height: 20rem;
      border-radius: 9999px;
      filter: blur(56px);
      opacity: 0.38;
    }

    .profile-glow-left {
      top: 5rem;
      left: -5rem;
      background: rgba(14, 165, 233, 0.42);
    }

    .profile-glow-right {
      top: 14rem;
      right: -6rem;
      background: rgba(56, 189, 248, 0.28);
    }
  `]
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  saving = false;

  readonly form = new FormGroup({
    fullName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    username: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    avatarUrl: new FormControl('', { nonNullable: true }),
    bio: new FormControl('', { nonNullable: true }),
  });

  constructor(
    private readonly authService: AuthService,
    private readonly snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    if (!this.user) {
      this.authService.fetchProfile().subscribe(user => {
        this.setUser(user);
      });
      return;
    }

    this.setUser(this.user);
  }

  get initials(): string {
    return this.user?.fullName?.trim()?.charAt(0)?.toUpperCase() || '?';
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    this.saving = true;
    const value = this.form.getRawValue();
    this.authService.updateProfile({
      fullName: value.fullName.trim(),
      username: value.username.trim(),
      avatarUrl: value.avatarUrl.trim() || undefined,
      bio: value.bio.trim() || undefined,
    }).subscribe({
      next: (user) => {
        this.setUser(user);
        this.saving = false;
        this.snack.open('Profile updated', 'Close', { duration: 2500 });
      },
      error: (err) => {
        this.saving = false;
        const message =
          err?.error?.message ||
          err?.message ||
          'Failed to update profile' + (err?.status ? ' (' + err.status + ')' : '');
        this.snack.open(message, 'Close', { duration: 4500 });
      }
    });
  }

  private setUser(user: User): void {
    this.user = user;
    this.form.setValue({
      fullName: user.fullName || '',
      username: user.username || '',
      avatarUrl: user.avatarUrl || '',
      bio: user.bio || '',
    });
  }

  getAvatarBackgroundImage(url: string | undefined): string | null {
    const safeUrl = this.normalizeAvatarUrl(url);
    return safeUrl ? `url("${safeUrl}")` : null;
  }

  private normalizeAvatarUrl(url: string | undefined): string | null {
    const value = String(url || '').trim();
    if (!value) {
      return null;
    }

    try {
      const parsed = new URL(value);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        return null;
      }

      return parsed.toString();
    } catch {
      return null;
    }
  }
}
