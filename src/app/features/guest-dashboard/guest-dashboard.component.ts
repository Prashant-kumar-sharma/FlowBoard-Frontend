import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { catchError, of } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { WorkspaceService } from '../../core/services/workspace.service';
import { Workspace } from '../../core/models/workspace.model';

interface DemoCard {
  text: string;
  initials: string;
  label?: boolean;
  labelColor?: string;
  dueDate?: string;
  accent?: boolean;
}

interface DemoColumn {
  name: string;
  color: string;
  count: number;
  cards: DemoCard[];
}

@Component({
  selector: 'app-guest-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule],
  template: `
    <!-- Navbar -->
    <nav class="guest-nav">
      <div class="nav-inner">
        <a routerLink="/" class="logo">
          <span class="logo-icon">⬡</span>
          <span class="logo-text">FlowBoard</span>
        </a>
        <div class="nav-actions">
          <a routerLink="/auth/login" mat-stroked-button class="nav-btn-outline">Log in</a>
          <a routerLink="/auth/register" mat-flat-button color="primary" class="nav-btn-fill">Get Started Free</a>
        </div>
      </div>
    </nav>

    <!-- Hero -->
    <section class="hero">
      <div class="hero-bg-orbs">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
      </div>
      <div class="hero-content">
        <span class="hero-badge">✨ Collaborative Task Management</span>
        <h1 class="hero-title">
          Organize anything,<br>
          <span class="gradient-text">together.</span>
        </h1>
        <p class="hero-subtitle">
          FlowBoard brings your tasks, teammates, and tools together.
          Plan projects, track progress, and ship faster — all in one beautiful workspace.
        </p>
        <div class="hero-cta">
          <a routerLink="/auth/register" mat-flat-button class="cta-primary">
            Start for free
            <mat-icon>arrow_forward</mat-icon>
          </a>
          <a routerLink="/auth/login" mat-stroked-button class="cta-secondary">
            Sign in to your account
          </a>
        </div>
      </div>

      <!-- Demo Board Preview -->
      <div class="board-preview-wrapper">
        <div class="board-preview">
          <div class="board-header-bar">
            <span class="board-dot red"></span>
            <span class="board-dot yellow"></span>
            <span class="board-dot green"></span>
            <span class="board-title-bar">Sprint Board — Week 17</span>
          </div>
          <div class="board-columns">
            <div class="demo-column" *ngFor="let col of demoColumns">
              <div class="col-header">
                <span class="col-badge" [style.background]="col.color">{{ col.count }}</span>
                {{ col.name }}
              </div>
              <div class="demo-card" *ngFor="let card of col.cards"
                   [class.card-accent]="card.accent">
                <span class="card-label" *ngIf="card.label" [style.background]="card.labelColor"></span>
                <p class="card-text">{{ card.text }}</p>
                <div class="card-meta">
                  <span class="card-avatar">{{ card.initials }}</span>
                  <span *ngIf="card.dueDate" class="card-due">{{ card.dueDate }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="public-workspaces" *ngIf="publicWorkspacesLoaded && publicWorkspaces.length">
      <div class="public-workspaces-head">
        <div>
          <p class="public-kicker">Public workspaces</p>
          <h2 class="section-title">See how teams organize work in the open</h2>
        </div>
        <a routerLink="/auth/register" mat-stroked-button class="cta-secondary" *ngIf="!isLoggedIn">
          Join to explore more
        </a>
      </div>

      <div class="public-workspaces-grid">
        <article class="public-workspace-card" *ngFor="let workspace of publicWorkspaces">
          <div class="public-workspace-top">
            <div class="public-workspace-avatar">
              {{ getWorkspaceInitials(workspace.name) }}
            </div>
            <span class="public-workspace-visibility">
              <mat-icon>public</mat-icon>
              Public
            </span>
          </div>

          <h3>{{ workspace.name }}</h3>
          <p>{{ getWorkspaceSummary(workspace) }}</p>

          <div class="public-workspace-meta">
            <span>
              <mat-icon>groups</mat-icon>
              {{ workspace.members.length }} members
            </span>
            <span>
              <mat-icon>calendar_today</mat-icon>
              {{ workspace.createdAt | date:'MMM y' }}
            </span>
          </div>

          <a
            mat-flat-button
            color="primary"
            class="cta-primary public-workspace-action"
            [routerLink]="['/workspace', workspace.id]"
          >
            Explore workspace
          </a>
        </article>
      </div>
    </section>

    <!-- Features -->
    <section class="features">
      <h2 class="section-title">Everything you need to <span class="gradient-text">ship faster</span></h2>
      <div class="features-grid">
        <div class="feature-card" *ngFor="let f of features">
          <div class="feature-icon" [style.background]="f.bg">
            <mat-icon>{{ f.icon }}</mat-icon>
          </div>
          <h3>{{ f.title }}</h3>
          <p>{{ f.desc }}</p>
        </div>
      </div>
    </section>

    <!-- CTA Banner -->
    <section class="cta-banner">
      <div class="cta-inner">
        <h2>Ready to get started?</h2>
        <p>Join thousands of teams already using FlowBoard to ship better products.</p>
        <a routerLink="/auth/register" mat-flat-button class="cta-primary">
          Create free account
          <mat-icon>arrow_forward</mat-icon>
        </a>
      </div>
    </section>

    <!-- Footer -->
    <footer class="guest-footer">
      <span class="logo-icon">⬡</span>
      <span>FlowBoard &copy; 2026. Built for productive teams.</span>
    </footer>
  `,
  styles: [`
    :host { display: block; background: #06060f; color: #e2e8f0; overflow-x: hidden; }

    /* ── Nav ── */
    .guest-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 50;
      background: rgba(6,6,15,.7); backdrop-filter: blur(16px); border-bottom: 1px solid rgba(255,255,255,.06); }
    .nav-inner { max-width: 1200px; margin: 0 auto; padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; }
    .logo { display: flex; align-items: center; gap: 8px; text-decoration: none; color: #fff; }
    .logo-icon { font-size: 22px; filter: drop-shadow(0 0 6px rgba(99,102,241,.6)); }
    .logo-text { font-size: 20px; font-weight: 700; letter-spacing: -.3px; }
    .nav-actions { display: flex; gap: 10px; align-items: center; }
    .nav-btn-outline { color: #cbd5e1 !important; border-color: rgba(255,255,255,.15) !important; font-size: 13px !important; }
    .nav-btn-fill { font-size: 13px !important; }

    /* ── Hero ── */
    .hero { position: relative; padding: 140px 24px 60px; text-align: center; overflow: hidden; }
    .hero-bg-orbs { position: absolute; inset: 0; pointer-events: none; }
    .orb { position: absolute; border-radius: 50%; filter: blur(90px); opacity: .35; }
    .orb-1 { width: 500px; height: 500px; background: #6366f1; top: -100px; left: -100px; animation: float 8s ease-in-out infinite; }
    .orb-2 { width: 400px; height: 400px; background: #06b6d4; top: 50px; right: -80px; animation: float 10s ease-in-out infinite reverse; }
    .orb-3 { width: 300px; height: 300px; background: #a855f7; bottom: -50px; left: 40%; animation: float 12s ease-in-out infinite; }
    @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-30px)} }

    .hero-content { position: relative; z-index: 1; max-width: 700px; margin: 0 auto; }
    .hero-badge { display: inline-block; padding: 6px 16px; border-radius: 999px; font-size: 13px; font-weight: 500;
      background: rgba(99,102,241,.15); border: 1px solid rgba(99,102,241,.3); color: #a5b4fc; margin-bottom: 24px; }
    .hero-title { font-size: clamp(2.2rem,5.5vw,3.6rem); font-weight: 800; line-height: 1.1; letter-spacing: -.02em; color: #fff; margin: 0 0 20px; }
    .gradient-text { background: linear-gradient(135deg, #6366f1, #06b6d4, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .hero-subtitle { font-size: 17px; line-height: 1.7; color: #94a3b8; max-width: 520px; margin: 0 auto 32px; }
    .hero-cta { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
    .cta-primary { background: linear-gradient(135deg,#6366f1,#4f46e5) !important; color: #fff !important; font-weight: 600 !important;
      padding: 0 28px !important; height: 46px !important; border-radius: 10px !important; font-size: 15px !important;
      box-shadow: 0 4px 20px rgba(99,102,241,.4) !important; }
    .cta-primary mat-icon { font-size: 18px; margin-left: 6px; }
    .cta-secondary { color: #cbd5e1 !important; border-color: rgba(255,255,255,.15) !important; height: 46px !important;
      border-radius: 10px !important; font-size: 15px !important; }

    /* ── Board Preview ── */
    .board-preview-wrapper { position: relative; z-index: 1; max-width: 900px; margin: 56px auto 0; perspective: 1200px; }
    .board-preview { background: #111827; border: 1px solid rgba(255,255,255,.08); border-radius: 16px; overflow: hidden;
      box-shadow: 0 32px 80px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.05);
      transform: rotateX(4deg); transition: transform .4s ease; }
    .board-preview:hover { transform: rotateX(0); }
    .board-header-bar { display: flex; align-items: center; gap: 8px; padding: 12px 18px; background: #0f172a; border-bottom: 1px solid rgba(255,255,255,.06); }
    .board-dot { width: 10px; height: 10px; border-radius: 50%; }
    .board-dot.red { background: #ef4444; } .board-dot.yellow { background: #eab308; } .board-dot.green { background: #22c55e; }
    .board-title-bar { font-size: 12px; color: #64748b; margin-left: 8px; }
    .board-columns { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 16px; min-height: 220px; }
    .demo-column { background: rgba(255,255,255,.03); border-radius: 10px; padding: 10px; }
    .col-header { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: #94a3b8; padding: 4px 6px 10px;
      display: flex; align-items: center; gap: 8px; }
    .col-badge { width: 18px; height: 18px; border-radius: 5px; display: flex; align-items: center; justify-content: center;
      font-size: 10px; color: #fff; font-weight: 700; }
    .demo-card { background: #1e293b; border-radius: 8px; padding: 10px 12px; margin-bottom: 8px; border: 1px solid rgba(255,255,255,.05);
      transition: transform .2s, box-shadow .2s; cursor: default; }
    .demo-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,.3); }
    .demo-card.card-accent { border-left: 3px solid #6366f1; }
    .card-label { display: block; width: 36px; height: 4px; border-radius: 2px; margin-bottom: 8px; }
    .card-text { font-size: 12px; color: #e2e8f0; margin: 0 0 8px; line-height: 1.4; }
    .card-meta { display: flex; align-items: center; justify-content: space-between; }
    .card-avatar { width: 20px; height: 20px; border-radius: 50%; background: #334155; display: flex; align-items: center; justify-content: center;
      font-size: 9px; font-weight: 700; color: #94a3b8; }
    .card-due { font-size: 10px; color: #64748b; }

    /* Public Workspaces */
    .public-workspaces { max-width: 1100px; margin: 0 auto; padding: 24px 24px 0; }
    .public-workspaces-head { display: flex; align-items: end; justify-content: space-between; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; }
    .public-kicker { margin: 0 0 10px; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: .18em; }
    .public-workspaces-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; }
    .public-workspace-card {
      background: linear-gradient(180deg, rgba(15,23,42,.9), rgba(15,23,42,.74));
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 20px;
      padding: 22px;
      box-shadow: 0 24px 50px rgba(0,0,0,.24);
    }
    .public-workspace-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .public-workspace-avatar {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #06b6d4, #6366f1);
      color: #fff;
      font-weight: 700;
      letter-spacing: .04em;
    }
    .public-workspace-visibility,
    .public-workspace-meta span {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .public-workspace-visibility {
      color: #a5f3fc;
      background: rgba(6,182,212,.12);
      border: 1px solid rgba(34,211,238,.18);
      border-radius: 999px;
      padding: 6px 10px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: .12em;
    }
    .public-workspace-visibility mat-icon,
    .public-workspace-meta mat-icon { width: 16px; height: 16px; font-size: 16px; }
    .public-workspace-card h3 { margin: 18px 0 10px; font-size: 20px; color: #fff; }
    .public-workspace-card p { margin: 0; color: #94a3b8; line-height: 1.7; font-size: 14px; min-height: 72px; }
    .public-workspace-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin: 18px 0 0;
      color: #cbd5e1;
      font-size: 12px;
    }
    .public-workspace-action { margin-top: 22px; width: 100%; justify-content: center; }

    /* ── Features ── */
    .features { max-width: 1100px; margin: 0 auto; padding: 80px 24px; text-align: center; }
    .section-title { font-size: 2rem; font-weight: 700; color: #fff; margin-bottom: 48px; }
    .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; }
    .feature-card { background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.06); border-radius: 16px; padding: 28px 24px; text-align: left;
      transition: transform .25s, border-color .25s; }
    .feature-card:hover { transform: translateY(-4px); border-color: rgba(99,102,241,.3); }
    .feature-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
      margin-bottom: 16px; color: #fff; }
    .feature-icon mat-icon { font-size: 22px; }
    .feature-card h3 { font-size: 16px; font-weight: 600; color: #f1f5f9; margin: 0 0 8px; }
    .feature-card p { font-size: 13px; color: #94a3b8; line-height: 1.6; margin: 0; }

    /* ── CTA Banner ── */
    .cta-banner { padding: 80px 24px; }
    .cta-inner { max-width: 600px; margin: 0 auto; text-align: center; background: linear-gradient(135deg, rgba(99,102,241,.12), rgba(168,85,247,.12));
      border: 1px solid rgba(99,102,241,.2); border-radius: 24px; padding: 48px 32px; }
    .cta-inner h2 { font-size: 1.8rem; font-weight: 700; color: #fff; margin: 0 0 12px; }
    .cta-inner p { color: #94a3b8; margin: 0 0 28px; font-size: 15px; }

    /* ── Footer ── */
    .guest-footer { text-align: center; padding: 32px 24px; border-top: 1px solid rgba(255,255,255,.06); color: #64748b; font-size: 13px;
      display: flex; align-items: center; justify-content: center; gap: 8px; }

    @media (max-width: 768px) {
      .board-columns { grid-template-columns: repeat(2, 1fr); }
      .hero { padding-top: 120px; }
    }
    @media (max-width: 480px) {
      .board-columns { grid-template-columns: 1fr 1fr; }
      .nav-btn-outline { display: none !important; }
    }

    mat-icon {
      font-family: 'Material Icons' !important;
      font-feature-settings: 'liga' !important;
    }
  `]
})
export class GuestDashboardComponent implements OnInit {
  publicWorkspaces: Workspace[] = [];
  publicWorkspacesLoaded = false;

  constructor(
    private workspaceService: WorkspaceService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.workspaceService.getPublic().pipe(
      catchError(() => of([] as Workspace[]))
    ).subscribe((workspaces) => {
      this.publicWorkspaces = workspaces.slice(0, 6);
      this.publicWorkspacesLoaded = true;
    });
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  getWorkspaceInitials(name: string): string {
    return name
      .match(/[a-zA-Z0-9]+/g)
      ?.slice(0, 2)
      ?.map((part) => part.charAt(0).toUpperCase())
      ?.join('') || 'WS';
  }

  getWorkspaceSummary(workspace: Workspace): string {
    return workspace.description?.trim() || `${workspace.members.length} member${workspace.members.length === 1 ? '' : 's'} collaborating here.`;
  }

  demoColumns: DemoColumn[] = [
    { name: 'Backlog', color: '#64748b', count: 3, cards: [
      { text: 'Research competitor analysis', initials: 'AK', label: true, labelColor: '#f59e0b', dueDate: 'Apr 25' },
      { text: 'Define user personas', initials: 'MR', accent: true },
      { text: 'Setup CI/CD pipeline', initials: 'PD', label: true, labelColor: '#6366f1' },
    ]},
    { name: 'In Progress', color: '#3b82f6', count: 2, cards: [
      { text: 'Design dashboard UI', initials: 'SJ', accent: true, label: true, labelColor: '#06b6d4', dueDate: 'Apr 22' },
      { text: 'Implement auth flow', initials: 'PD', dueDate: 'Apr 23' },
    ]},
    { name: 'Review', color: '#a855f7', count: 1, cards: [
      { text: 'API documentation', initials: 'AK', label: true, labelColor: '#22c55e' },
    ]},
    { name: 'Done', color: '#22c55e', count: 2, cards: [
      { text: 'Project kickoff meeting', initials: 'MR' },
      { text: 'Database schema design', initials: 'SJ', label: true, labelColor: '#ef4444' },
    ]},
  ];

  features = [
    { icon: 'dashboard', title: 'Kanban Boards', desc: 'Visualize your workflow with drag-and-drop boards, lists, and cards.', bg: 'linear-gradient(135deg,#6366f1,#4f46e5)' },
    { icon: 'group', title: 'Team Workspaces', desc: 'Create shared workspaces and collaborate with your team in real time.', bg: 'linear-gradient(135deg,#06b6d4,#0891b2)' },
    { icon: 'notifications_active', title: 'Smart Notifications', desc: 'Stay updated with real-time alerts on task changes and mentions.', bg: 'linear-gradient(135deg,#a855f7,#7c3aed)' },
    { icon: 'label', title: 'Labels & Filters', desc: 'Organize tasks with color-coded labels and powerful filtering.', bg: 'linear-gradient(135deg,#f59e0b,#d97706)' },
    { icon: 'comment', title: 'Comments & Activity', desc: 'Discuss tasks directly with threaded comments and activity feeds.', bg: 'linear-gradient(135deg,#22c55e,#16a34a)' },
    { icon: 'security', title: 'Secure & Reliable', desc: 'Enterprise-grade security with OAuth2, JWT auth, and role-based access.', bg: 'linear-gradient(135deg,#ef4444,#dc2626)' },
  ];
}
