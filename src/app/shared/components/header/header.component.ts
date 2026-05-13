import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { Store } from '@ngrx/store';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { NotificationPanelComponent } from '../../../features/notifications/notification-panel.component';
import { selectBoard } from '../../../store/board/board.selectors';
import { Board } from '../../../core/models/board.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatMenuModule, MatBadgeModule, MatIconModule, NotificationPanelComponent],
  template: `
    <header
      class="header-shell"
      [class.header-hidden]="headerHidden"
      [class.header-theme-light]="useLightTheme"
      [style.--header-background]="headerBackground"
      [style.--header-border]="headerBorderColor"
      [style.--header-shadow]="headerShadow"
    >
      <div class="header-inner">
        <a [routerLink]="authService.getHomeRoute()" class="header-logo">
          <span class="logo-hex">□</span>
          <span class="logo-text">FlowBoard</span>
        </a>

        <nav class="header-nav" *ngIf="(authService.currentUser$ | async) as user">
          <a routerLink="/dashboard" class="nav-link" routerLinkActive="active-link">
            <mat-icon>dashboard</mat-icon>
            Dashboard
          </a>
          <a *ngIf="authService.isPlatformAdmin(user)" routerLink="/admin" class="nav-link nav-link-admin" routerLinkActive="active-link">
            <mat-icon>admin_panel_settings</mat-icon>
            Admin Console
          </a>
        </nav>

        <div class="header-actions">
          <div class="notification-shell" (click)="$event.stopPropagation()">
            <button class="action-btn"
                    [matBadge]="(notificationService.unreadCount$ | async) || ''"
                    [matBadgeHidden]="(notificationService.unreadCount$ | async) === 0"
                    matBadgeColor="warn"
                    matBadgeSize="small"
                    (click)="toggleNotifications()"
                    [attr.aria-expanded]="notificationsOpen"
                    aria-label="Notifications">
              <mat-icon>notifications_none</mat-icon>
            </button>

            <div class="notification-popover" *ngIf="notificationsOpen">
              <app-notification-panel></app-notification-panel>
            </div>
          </div>

          <span class="header-divider"></span>

          <button class="avatar-btn" [matMenuTriggerFor]="userMenu" aria-label="Open profile menu">
            <span *ngIf="(authService.currentUser$ | async) as user" class="avatar-circle">
              <img
                *ngIf="getResolvedAvatarUrl(user.avatarUrl) as avatarSrc; else headerAvatarFallback"
                [src]="avatarSrc"
                [alt]="user.fullName + ' avatar'"
                class="h-full w-full rounded-full object-cover"
                (error)="markAvatarFailed(user.avatarUrl)"
              >
              <ng-template #headerAvatarFallback>
                <span>{{ getInitials(user.fullName) }}</span>
              </ng-template>
            </span>
            <div class="avatar-info" *ngIf="(authService.currentUser$ | async) as user">
              <span class="avatar-name">{{ user.fullName }}</span>
              <span class="avatar-role">{{ user.role === 'PLATFORM_ADMIN' ? 'Platform Admin' : 'Member' }}</span>
            </div>
            <mat-icon class="avatar-chevron">expand_more</mat-icon>
          </button>

          <mat-menu #userMenu="matMenu" xPosition="before" class="profile-menu-panel" backdropClass="profile-menu-backdrop">
            <div class="menu-header" *ngIf="(authService.currentUser$ | async) as user">
              <div class="menu-header-avatar">
                <span class="avatar-circle">
                  <img
                    *ngIf="getResolvedAvatarUrl(user.avatarUrl) as menuAvatarSrc; else menuAvatarFallback"
                    [src]="menuAvatarSrc"
                    [alt]="user.fullName + ' avatar'"
                    class="h-full w-full rounded-full object-cover"
                    (error)="markAvatarFailed(user.avatarUrl)"
                  >
                  <ng-template #menuAvatarFallback>
                    <span>{{ getInitials(user.fullName) }}</span>
                  </ng-template>
                </span>
              </div>
              <div class="menu-header-info">
                <div class="menu-header-name">{{ user.fullName }}</div>
                <div class="menu-header-email">{{ user.email }}</div>
              </div>
            </div>
            <a routerLink="/dashboard" mat-menu-item>
              <mat-icon>space_dashboard</mat-icon>
              <span>My Dashboard</span>
            </a>
            <a routerLink="/profile" mat-menu-item>
              <mat-icon>person_outline</mat-icon>
              <span>Profile</span>
            </a>
            <a *ngIf="authService.isPlatformAdmin()" routerLink="/admin" mat-menu-item>
              <mat-icon>settings_suggest</mat-icon>
              <span>Admin Console</span>
            </a>
            <div class="menu-divider"></div>
            <button mat-menu-item (click)="authService.logout()" class="logout-item">
              <mat-icon>logout</mat-icon>
              <span>Sign out</span>
            </button>
          </mat-menu>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .header-shell {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 100;
      background: var(--header-background);
      border-bottom: 1px solid var(--header-border);
      backdrop-filter: blur(20px);
      box-shadow: var(--header-shadow);
      transition: transform 0.3s ease;
    }
    .header-theme-light {
      color: #0f172a;
    }
    .header-hidden { transform: translateY(-100%); }
    .header-inner {
      max-width: 1440px;
      margin: 0 auto;
      padding: 0 1.5rem;
      height: 3.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }
    .header-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: #fff;
      flex-shrink: 0;
    }
    .logo-hex {
      font-size: 22px;
      filter: drop-shadow(0 0 8px rgba(99, 102, 241, 0.6));
      animation: hex-pulse 4s ease-in-out infinite;
    }
    @keyframes hex-pulse {
      0%, 100% { filter: drop-shadow(0 0 8px rgba(99, 102, 241, 0.6)); }
      50% { filter: drop-shadow(0 0 14px rgba(56, 189, 248, 0.8)); }
    }
    .logo-text {
      font-size: 1.15rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .header-theme-light .logo-text {
      background: linear-gradient(135deg, #0f172a 0%, #334155 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .header-nav {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      margin-left: 1.5rem;
    }
    .nav-link {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 10px;
      font-size: 13.5px;
      font-weight: 600;
      color: #f1f5f9;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    .header-theme-light .nav-link {
      color: rgba(15, 23, 42, 0.84);
    }
    .nav-link:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.08);
    }
    .header-theme-light .nav-link:hover {
      color: #0f172a;
      background: rgba(255, 255, 255, 0.32);
    }
    .nav-link.active-link {
      color: #fff;
      background: rgba(56, 189, 248, 0.15);
      box-shadow: inset 0 0 0 1px rgba(56, 189, 248, 0.2);
    }
    .header-theme-light .nav-link.active-link {
      color: #0f172a;
      background: rgba(255, 255, 255, 0.44);
      box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.08);
    }
    .nav-link-admin {
      color: #dbeafe;
      background: rgba(14, 165, 233, 0.08);
    }
    .header-theme-light .nav-link-admin {
      color: #0f172a;
      background: rgba(255, 255, 255, 0.26);
    }
    .nav-link mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-left: auto;
    }
    .action-btn {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.06);
      background: rgba(255, 255, 255, 0.04);
      color: rgba(203, 213, 225, 0.85);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .header-theme-light .action-btn {
      border-color: rgba(15, 23, 42, 0.08);
      background: rgba(255, 255, 255, 0.2);
      color: rgba(15, 23, 42, 0.72);
    }
    .action-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      border-color: rgba(255, 255, 255, 0.12);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
    .header-theme-light .action-btn:hover {
      background: rgba(255, 255, 255, 0.42);
      color: #0f172a;
      border-color: rgba(15, 23, 42, 0.12);
    }
    .action-btn mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .notification-shell {
      position: relative;
      display: flex;
      align-items: center;
    }
    .notification-popover {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      z-index: 120;
      width: min(26rem, calc(100vw - 1rem));
    }
    .header-divider {
      width: 1px;
      height: 24px;
      background: linear-gradient(180deg, transparent, rgba(148, 163, 184, 0.2), transparent);
      margin: 0 0.25rem;
    }
    .header-theme-light .header-divider {
      background: linear-gradient(180deg, transparent, rgba(15, 23, 42, 0.16), transparent);
    }
    .avatar-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 4px 10px 4px 4px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.06);
      background: rgba(255, 255, 255, 0.03);
      cursor: pointer;
      transition: all 0.2s ease;
      color: #fff;
    }
    .header-theme-light .avatar-btn {
      border-color: rgba(15, 23, 42, 0.08);
      background: rgba(255, 255, 255, 0.18);
      color: #0f172a;
    }
    .avatar-btn:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.12);
    }
    .header-theme-light .avatar-btn:hover {
      background: rgba(255, 255, 255, 0.36);
      border-color: rgba(15, 23, 42, 0.12);
    }
    .avatar-circle {
      display: flex;
      width: 32px;
      height: 32px;
      align-items: center;
      justify-content: center;
      border-radius: 9999px;
      background: linear-gradient(135deg, #6366f1, #0ea5e9);
      background-position: center;
      background-repeat: no-repeat;
      background-size: cover;
      color: #fff;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.04em;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
    }
    .avatar-info {
      display: flex;
      flex-direction: column;
      line-height: 1;
    }
    .avatar-name {
      font-size: 13px;
      font-weight: 600;
      color: #ffffff;
      letter-spacing: 0.01em;
    }
    .header-theme-light .avatar-name {
      color: #0f172a;
    }
    .avatar-role {
      font-size: 10px;
      font-weight: 700;
      color: #38bdf8;
      margin-top: 2px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .avatar-chevron {
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
      color: rgba(148, 163, 184, 0.5);
      transition: transform 0.2s ease;
    }
    .header-theme-light .avatar-chevron {
      color: rgba(15, 23, 42, 0.42);
    }
    .avatar-btn:hover .avatar-chevron {
      color: rgba(203, 213, 225, 0.8);
    }
    .header-theme-light .avatar-btn:hover .avatar-chevron {
      color: rgba(15, 23, 42, 0.72);
    }
    .menu-header {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 20px 20px 16px;
    }
    .menu-header-avatar .avatar-circle {
      width: 42px;
      height: 42px;
      font-size: 15px;
      border-radius: 9999px;
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
    }
    .menu-header-name {
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
    }
    .menu-header-email {
      font-size: 11.5px;
      color: #64748b;
      margin-top: 3px;
    }
    .menu-divider {
      height: 1px;
      background: rgba(226, 232, 240, 0.5);
      margin: 4px 12px;
    }
    :host ::ng-deep .notification-menu-panel .mat-mdc-menu-content {
      padding: 0 !important;
    }
    :host ::ng-deep .notification-menu-panel.mat-mdc-menu-panel {
      min-width: 26rem !important;
      max-width: min(26rem, calc(100vw - 1rem)) !important;
      border-radius: 18px !important;
      background: transparent !important;
      box-shadow: none !important;
      overflow: visible !important;
    }
    @media (max-width: 640px) {
      .header-nav { display: none; }
      .avatar-info { display: none; }
      .avatar-chevron { display: none; }
      .avatar-btn { padding: 3px; border-radius: 9px; }
      .notification-popover {
        position: fixed;
        top: 4.25rem;
        right: 0.5rem;
        left: 0.5rem;
        width: auto;
      }
    }
  `]
})
export class HeaderComponent implements OnInit, OnDestroy {
  headerHidden = false;
  notificationsOpen = false;
  useLightTheme = false;
  headerBackground = 'linear-gradient(135deg, #0a0f1e 0%, #0f172a 40%, #0c1628 100%)';
  headerBorderColor = 'rgba(56, 189, 248, 0.08)';
  headerShadow = '0 1px 0 rgba(255, 255, 255, 0.04), 0 4px 24px rgba(0, 0, 0, 0.28), 0 0 80px rgba(14, 165, 233, 0.06)';
  private lastScrollY = 0;
  private readonly SCROLL_THRESHOLD = 10;
  private readonly destroy$ = new Subject<void>();
  private readonly failedAvatarUrls = new Set<string>();

  constructor(
    public authService: AuthService,
    public notificationService: NotificationService,
    private readonly store: Store
  ) {}

  @HostListener('document:click')
  onDocumentClick(): void {
    this.notificationsOpen = false;
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const currentScrollY = window.scrollY;
    const delta = currentScrollY - this.lastScrollY;

    if (Math.abs(delta) < this.SCROLL_THRESHOLD) {
      return;
    }

    if (delta > 0 && currentScrollY > 56) {
      this.headerHidden = true;
    } else if (delta < 0) {
      this.headerHidden = false;
    }

    this.lastScrollY = currentScrollY;
  }

  getInitials(fullName: string | undefined): string {
    return fullName
      ?.match(/[a-zA-Z0-9]+/g)
      ?.slice(0, 2)
      ?.map(p => p.charAt(0).toUpperCase())
      ?.join('') || '?';
  }

  ngOnInit(): void {
    this.notificationService.getUnreadCount().subscribe();
    this.notificationService.startPolling();
    this.store.select(selectBoard)
      .pipe(takeUntil(this.destroy$))
      .subscribe((board) => this.applyBoardTheme(board));
  }

  toggleNotifications(): void {
    this.notificationsOpen = !this.notificationsOpen;
  }

  getResolvedAvatarUrl(url: string | undefined): string | null {
    const safeUrl = this.normalizeAvatarUrl(url);
    if (!safeUrl) {
      return null;
    }

    const resolved = this.appendAvatarRevision(safeUrl);
    return this.failedAvatarUrls.has(resolved) ? null : resolved;
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

  private appendAvatarRevision(url: string): string {
    try {
      const parsed = new URL(url);
      parsed.searchParams.set('avatarRev', this.authService.getAvatarRevision());
      return parsed.toString();
    } catch {
      return url;
    }
  }

  markAvatarFailed(url: string | undefined): void {
    const safeUrl = this.normalizeAvatarUrl(url);
    if (!safeUrl) {
      return;
    }

    this.failedAvatarUrls.add(this.appendAvatarRevision(safeUrl));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.notificationService.stopPolling();
  }

  private applyBoardTheme(board: Board | null): void {
    const baseColor = this.normalizeColor(board?.background);
    if (!baseColor) {
      this.useLightTheme = false;
      this.headerBackground = 'linear-gradient(135deg, #0a0f1e 0%, #0f172a 40%, #0c1628 100%)';
      this.headerBorderColor = 'rgba(56, 189, 248, 0.08)';
      this.headerShadow = '0 1px 0 rgba(255, 255, 255, 0.04), 0 4px 24px rgba(0, 0, 0, 0.28), 0 0 80px rgba(14, 165, 233, 0.06)';
      return;
    }

    const rgb = this.hexToRgb(baseColor);
    if (!rgb) {
      return;
    }

    const luminance = this.getLuminance(rgb.r, rgb.g, rgb.b);
    this.useLightTheme = luminance > 0.62;
    const overlayStrength = this.useLightTheme ? 0.16 : 0.34;
    const overlayAccent = this.useLightTheme ? 0.04 : 0.18;
    const borderTone = this.useLightTheme ? 'rgba(15, 23, 42, 0.10)' : 'rgba(255, 255, 255, 0.10)';
    const glowColor = this.useLightTheme
      ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.18)`
      : `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.28)`;

    this.headerBackground =
      `linear-gradient(135deg, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.94) 0%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.88) 100%), ` +
      `linear-gradient(180deg, rgba(255, 255, 255, ${overlayAccent}), rgba(15, 23, 42, ${overlayStrength}))`;
    this.headerBorderColor = borderTone;
    this.headerShadow =
      `0 1px 0 rgba(255, 255, 255, ${this.useLightTheme ? '0.20' : '0.06'}), ` +
      `0 10px 28px rgba(15, 23, 42, ${this.useLightTheme ? '0.12' : '0.28'}), ` +
      `0 0 70px ${glowColor}`;
  }

  private normalizeColor(value: string | undefined): string | null {
    const color = String(value || '').trim();
    return /^#([0-9a-fA-F]{6})$/.test(color) ? color : null;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const normalized = hex.replace('#', '');
    if (normalized.length !== 6) {
      return null;
    }

    const parsed = Number.parseInt(normalized, 16);
    return {
      r: (parsed >> 16) & 255,
      g: (parsed >> 8) & 255,
      b: parsed & 255,
    };
  }

  private getLuminance(r: number, g: number, b: number): number {
    const [red, green, blue] = [r, g, b].map((channel) => {
      const value = channel / 255;
      return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  }
}
