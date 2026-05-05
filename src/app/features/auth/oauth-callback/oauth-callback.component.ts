import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center">
      <mat-spinner diameter="48"></mat-spinner>
      <p class="mt-4 text-gray-600">Completing sign in...</p>
    </div>
  `
})
export class OAuthCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        this.auth.handleOAuthCallback(token);
        return;
      }

      this.router.navigate(['/auth/login'], {
        queryParams: { oauthError: 'Missing OAuth token. Please try again.' }
      });
    });
  }
}
