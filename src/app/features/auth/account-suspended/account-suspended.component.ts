import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-account-suspended',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="suspended-shell">
      <div class="suspended-glow suspended-glow-left"></div>
      <div class="suspended-glow suspended-glow-right"></div>

      <section class="suspended-card">
        <div class="status-badge">
          <span class="status-dot"></span>
          Account suspended
        </div>

        <div class="icon-wrap">
          <mat-icon>gpp_bad</mat-icon>
        </div>

        <h1>Your FlowBoard account is suspended</h1>
        <p class="lead">
          This account cannot access dashboards, boards, workspaces, or any other app features until a platform administrator removes the suspension.
        </p>
        <p class="support-copy">
          You can log out now, or contact your administrator to request reactivation.
        </p>

        <div class="actions">
          <button mat-flat-button color="primary" type="button" (click)="logout()">
            <mat-icon>logout</mat-icon>
            Log out
          </button>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .suspended-shell {
      position: relative;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      overflow: hidden;
      background:
        radial-gradient(circle at top left, rgba(248, 113, 113, 0.2), transparent 24rem),
        radial-gradient(circle at 85% 15%, rgba(251, 191, 36, 0.16), transparent 20rem),
        linear-gradient(135deg, #0f172a 0%, #1e293b 48%, #111827 100%);
    }

    .suspended-glow {
      position: absolute;
      width: 18rem;
      height: 18rem;
      border-radius: 9999px;
      filter: blur(58px);
      opacity: 0.38;
      pointer-events: none;
    }

    .suspended-glow-left {
      top: 4rem;
      left: -4rem;
      background: rgba(248, 113, 113, 0.34);
    }

    .suspended-glow-right {
      right: -4rem;
      bottom: 3rem;
      background: rgba(251, 191, 36, 0.28);
    }

    .suspended-card {
      position: relative;
      z-index: 1;
      width: min(100%, 38rem);
      padding: 2rem;
      border-radius: 2rem;
      border: 1px solid rgba(248, 250, 252, 0.12);
      background: rgba(15, 23, 42, 0.84);
      color: white;
      text-align: center;
      box-shadow: 0 30px 90px rgba(15, 23, 42, 0.34);
      backdrop-filter: blur(18px);
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.55rem;
      padding: 0.6rem 0.95rem;
      border-radius: 9999px;
      background: rgba(248, 113, 113, 0.12);
      border: 1px solid rgba(248, 113, 113, 0.25);
      color: #fecaca;
      font-size: 0.78rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .status-dot {
      width: 0.55rem;
      height: 0.55rem;
      border-radius: 9999px;
      background: #f87171;
      box-shadow: 0 0 16px rgba(248, 113, 113, 0.95);
    }

    .icon-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 5rem;
      height: 5rem;
      margin: 1.5rem auto 0;
      border-radius: 1.5rem;
      background: linear-gradient(135deg, rgba(248, 113, 113, 0.18), rgba(251, 191, 36, 0.16));
      color: #fca5a5;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
    }

    .icon-wrap mat-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
    }

    h1 {
      margin: 1.5rem 0 0;
      font-size: clamp(2rem, 5vw, 2.7rem);
      line-height: 1.12;
      font-weight: 800;
    }

    .lead {
      margin: 1rem auto 0;
      max-width: 31rem;
      color: #cbd5e1;
      font-size: 1rem;
      line-height: 1.8;
    }

    .support-copy {
      margin: 0.9rem auto 0;
      max-width: 28rem;
      color: #94a3b8;
      font-size: 0.94rem;
      line-height: 1.7;
    }

    .actions {
      display: flex;
      justify-content: center;
      margin-top: 1.75rem;
    }

    .actions button {
      min-height: 3.15rem;
      padding: 0 1.35rem;
      border-radius: 9999px;
      font-weight: 700;
      box-shadow: 0 18px 40px rgba(14, 165, 233, 0.2);
    }
  `]
})
export class AccountSuspendedComponent {
  constructor(private authService: AuthService) {}

  logout(): void {
    this.authService.logout();
  }
}
