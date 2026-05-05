import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { adminGuard } from './core/auth/admin.guard';
import { suspensionGuard } from './core/auth/suspension.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [suspensionGuard],
    loadComponent: () => import('./features/guest-dashboard/guest-dashboard.component').then(m => m.GuestDashboardComponent)
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'account-suspended',
    loadComponent: () => import('./features/auth/account-suspended/account-suspended.component').then(m => m.AccountSuspendedComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'workspace/:id',
    canActivate: [suspensionGuard],
    loadComponent: () => import('./features/workspace/workspace.component').then(m => m.WorkspaceComponent)
  },
  {
    path: 'board/:id',
    canActivate: [suspensionGuard],
    loadComponent: () => import('./features/board/board.component').then(m => m.BoardComponent)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'billing/premium',
    canActivate: [authGuard],
    loadComponent: () => import('./features/billing/premium-membership.component').then(m => m.PremiumMembershipComponent)
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },
  { path: '**', redirectTo: '' }
];
