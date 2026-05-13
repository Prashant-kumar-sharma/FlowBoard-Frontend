# Frontend API Coverage Checklist

Last updated: 2026-05-11

This checklist tracks backend controller endpoints against the frontend client layer.

Status meanings:
- `Service` means a frontend HTTP client method exists.
- `UI` means there is a known feature/component flow using it.
- `Legacy` means the endpoint exists but a newer frontend path is preferred.
- `Internal` means backend-only and not expected in the SPA.

## Auth Service

| Endpoint | Status | Notes |
| --- | --- | --- |
| `POST /auth/register` | Service, UI | Register flow |
| `POST /auth/register/request-otp` | Service, UI | Register flow |
| `POST /auth/register/verify-otp` | Service, UI | Register flow |
| `POST /auth/login` | Service | Present in client, not wired from current login template |
| `POST /auth/login/request-otp` | Service, UI | Login flow |
| `POST /auth/login/verify-otp` | Service, UI | Login flow |
| `POST /auth/reset-password` | Service, Legacy | OTP reset flow is the active UI path |
| `POST /auth/reset-password/request-otp` | Service, UI | Reset password flow |
| `POST /auth/reset-password/confirm` | Service, UI | Reset password flow |
| `POST /auth/logout` | Service | Local logout is still the primary behavior |
| `POST /auth/refresh` | Service | No current UI flow |
| `GET /auth/profile` | Service, UI | Profile and bootstrap |
| `PUT /auth/profile` | Service, UI | Profile page |
| `PUT /auth/password` | Service, UI | Profile page change password |
| `GET /auth/search` | Service, UI | Invite flows |
| `GET /auth/users` | Service | Admin path exists separately |
| `GET /auth/users/{userId}` | Service, UI | User lookups |
| `PATCH /auth/users/{userId}/deactivate` | Service | Admin path exists separately |
| `PATCH /auth/users/{userId}/reactivate` | Service | Admin path exists separately |
| `DELETE /auth/users/{userId}` | Service | Admin path exists separately |
| `/auth/internal/**` | Internal | Backend-only |

## Workspace Service

| Endpoint Group | Status | Notes |
| --- | --- | --- |
| Workspace CRUD | Service, UI | Dashboard, workspace screens |
| Workspace member CRUD | Service, UI | Invite and management flows |
| Admin workspace endpoints | Service, UI | Admin screens |

## Board Service

| Endpoint Group | Status | Notes |
| --- | --- | --- |
| Board CRUD | Service, UI | Dashboard and board screens |
| Board member CRUD | Service, UI | Invite and management flows |
| Admin board endpoints | Service, UI | Admin screens |
| Internal workspace delete endpoint | Internal | Backend-only |

## List Service

| Endpoint Group | Status | Notes |
| --- | --- | --- |
| List CRUD and reorder | Service, UI | Board screen |
| List archive/unarchive/move | Service, UI | Board screen |
| Debug and internal delete endpoints | Internal | Not for SPA |

## Card Service

| Endpoint | Status | Notes |
| --- | --- | --- |
| Core card CRUD, move, reorder, assignee, priority, status | Service, UI | Board and card detail |
| `GET /cards/overdue` | Service, UI | Admin and dashboard usage |
| `GET /cards/admin/all` | Service, UI | Admin usage |
| `GET /cards/admin/activity` | Service, UI | Admin usage |
| `GET /cards/assignee/{userId}` | Service | No current UI flow |
| `GET /cards/{id}/activity` | Service | No current UI flow |
| Internal delete endpoints | Internal | Backend-only |

## Comment Service

| Endpoint | Status | Notes |
| --- | --- | --- |
| Comment CRUD and replies | Service, UI | Card detail |
| Attachment CRUD and upload | Service, UI | Card detail |
| `GET /cards/{cardId}/comments/count` | Service | No current UI flow |
| `GET /files/{filename}` | Service | No current UI flow |

## Label Service

| Endpoint | Status | Notes |
| --- | --- | --- |
| Board labels list/create | Service, UI | Card detail and board flows |
| `PUT /labels/{id}` | Service | No current UI flow |
| `DELETE /labels/{id}` | Service | No current UI flow |
| Card label assign/remove/list | Service, UI | Card detail |
| Checklist endpoints | Service, UI | Card detail |

## Notification Service

| Endpoint | Status | Notes |
| --- | --- | --- |
| List notifications | Service, UI | Notification panel |
| Unread count | Service, UI | Header and polling |
| Mark read / mark all read | Service, UI | Notification panel |
| Delete read | Service, UI | Notification panel |
| `DELETE /notifications/{id}` | Service | No current UI flow |
| Broadcast | Service, UI | Admin broadcasts |

## Payment Service

| Endpoint Group | Status | Notes |
| --- | --- | --- |
| Summary, checkout, confirm | Service, UI | Billing and dashboard |
| Internal payment endpoints | Internal | Backend-only |
