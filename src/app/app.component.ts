import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/auth/auth.service';
import { HeaderComponent } from './shared/components/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, HeaderComponent],
  template: `
    <app-header *ngIf="showHeader"></app-header>
    <main class="app-shell" [class.has-header]="showHeader">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: transparent;
    }

    .app-shell {
      min-height: 100vh;
      background: transparent;
    }

    .app-shell.has-header {
      padding-top: 3.5rem;
    }
  `]
})
export class AppComponent implements OnInit {
  constructor(public authService: AuthService) {}

  get showHeader(): boolean {
    const user = this.authService.getCurrentUser();
    return !!user && user.isActive !== false;
  }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.authService.ensureCurrentUserLoaded();
    }
  }
}
