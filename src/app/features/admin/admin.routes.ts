import { Routes } from '@angular/router';
export const ADMIN_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
  { path: 'users', loadComponent: () => import('./user-management/user-management.component').then(m => m.UserManagementComponent) },
  { path: 'analytics', loadComponent: () => import('./platform-analytics/platform-analytics.component').then(m => m.PlatformAnalyticsComponent) },
  { path: 'platform', loadComponent: () => import('./platform-management/platform-management.component').then(m => m.PlatformManagementComponent) },
  { path: 'overdue', loadComponent: () => import('./overdue-cards/overdue-cards.component').then(m => m.OverdueCardsComponent) },
  { path: 'audit', loadComponent: () => import('./audit-logs/audit-logs.component').then(m => m.AuditLogsComponent) },
  { path: 'reports', loadComponent: () => import('./activity-reports/activity-reports.component').then(m => m.ActivityReportsComponent) },
  { path: 'broadcasts', loadComponent: () => import('./broadcasts/broadcasts.component').then(m => m.BroadcastsComponent) },
];
