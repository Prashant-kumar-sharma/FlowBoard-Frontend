# FlowBoard Frontend

The Angular 17+ SPA for the **FlowBoard** Kanban platform. Built with standalone components, NgRx state management, Angular Material + Tailwind CSS, and real-time WebSocket integration.

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| **Angular** | 17.3 | Core framework (standalone components, lazy loading) |
| **NgRx** | 17.2 | State management (Store + Effects) |
| **Angular Material** | 17.3 | UI component library |
| **Angular CDK** | 17.3 | Drag-drop, overlays, accessibility |
| **Tailwind CSS** | 3.4 | Utility-first styling |
| **StompJS** | 6.1 | WebSocket (STOMP over SockJS) |
| **RxJS** | 7.8 | Reactive programming |
| **TypeScript** | 5.2 | Type safety (strict mode) |
| **Inter Font** | 5.x | Typography via `@fontsource/inter` |
| **Karma + Jasmine** | — | Unit testing |
| **Playwright** | 1.59 | E2E testing |

---

## Features

### Authentication
- 🔐 JWT login with email + password
- 📧 OTP-based registration & password reset
- 🌐 Google OAuth2 social login
- 🛡️ Route guards (`authGuard`, `adminGuard`, `suspensionGuard`)
- 🔄 Auto token refresh via HTTP interceptor

### Workspaces & Boards
- 🏢 Create, browse, and manage workspaces
- 📋 Create boards with custom backgrounds
- 👥 Invite members with role assignment
- 🔒 Public/private visibility controls

### Kanban Board
- 📝 Create lists (columns) with custom colors
- 🃏 Create cards with title, description, priority, status, dates
- 🖱️ **Drag-drop** cards between lists (CDK Drag-Drop)
- ↔️ Move & reorder lists across boards
- 📦 Archive / unarchive lists and cards

### Card Details
- 👤 Assign members to cards
- ⚡ Priority badges (`LOW` / `MEDIUM` / `HIGH` / `CRITICAL`)
- 📊 Status tracking (`TO_DO` → `IN_PROGRESS` → `IN_REVIEW` → `DONE`)
- 💬 Threaded comments with replies
- 📎 File attachments (upload + metadata)
- 🏷️ Labels & checklists with progress tracking
- 📋 Activity log (field-level change history)

### Notifications
- 🔔 Real-time in-app notification bell
- 📊 Unread count badge
- ✅ Mark read (individual / all)
- 🗑️ Delete read notifications

### Admin Panel
- 👥 User management (list, suspend, restore, delete, role change)
- 📊 Platform analytics & activity reports
- 📋 Audit logs & overdue card tracking
- 📢 Broadcast notifications

### Billing
- 💳 Premium membership page (Razorpay checkout)
- 📊 Subscription status & plan summary

---

## Project Structure

```
src/
├── app/
│   ├── app.component.ts          # Root component (router-outlet + header)
│   ├── app.config.ts             # App providers (NgRx, router, HTTP)
│   ├── app.routes.ts             # Lazy-loaded route definitions
│   │
│   ├── core/                     # Singleton services & infrastructure
│   │   ├── auth/                 # Auth guard, admin guard, suspension guard
│   │   ├── guards/               # Route protection
│   │   ├── interceptors/         # JWT token interceptor
│   │   ├── models/               # TypeScript interfaces
│   │   │   ├── user.model.ts
│   │   │   ├── workspace.model.ts
│   │   │   ├── board.model.ts
│   │   │   ├── list.model.ts
│   │   │   ├── card.model.ts
│   │   │   ├── comment.model.ts
│   │   │   ├── label.model.ts
│   │   │   ├── notification.model.ts
│   │   │   └── payment.model.ts
│   │   └── services/             # API service layer (one per microservice)
│   │       ├── admin.service.ts
│   │       ├── board.service.ts
│   │       ├── card.service.ts
│   │       ├── comment.service.ts
│   │       ├── label.service.ts
│   │       ├── list.service.ts
│   │       ├── notification.service.ts
│   │       ├── payment.service.ts
│   │       ├── websocket.service.ts
│   │       └── workspace.service.ts
│   │
│   ├── features/                 # Feature modules (lazy-loaded)
│   │   ├── auth/                 # Login, Register, Reset Password, OAuth callback
│   │   ├── dashboard/            # Authenticated user dashboard
│   │   ├── guest-dashboard/      # Public landing page
│   │   ├── workspace/            # Workspace detail view
│   │   ├── board/                # Kanban board (lists, cards, drag-drop)
│   │   │   ├── card-detail/      # Card detail dialog
│   │   │   ├── create-board-dialog
│   │   │   ├── create-card-dialog
│   │   │   ├── create-list-dialog
│   │   │   ├── move-list-dialog
│   │   │   └── board-invite-dialog
│   │   ├── profile/              # User profile editor
│   │   ├── billing/              # Premium membership & checkout
│   │   ├── notifications/        # Notification center
│   │   └── admin/                # Admin panel
│   │       ├── admin-dashboard/
│   │       ├── user-management/
│   │       ├── platform-analytics/
│   │       ├── activity-reports/
│   │       ├── audit-logs/
│   │       ├── overdue-cards/
│   │       ├── broadcasts/
│   │       └── platform-management/
│   │
│   ├── shared/                   # Reusable components & pipes
│   │   ├── components/
│   │   │   ├── header/           # Navigation bar
│   │   │   ├── confirm-dialog/   # Reusable confirmation modal
│   │   │   ├── prompt-dialog/    # Reusable input prompt modal
│   │   │   └── priority-badge/   # Card priority indicator
│   │   └── pipes/                # Custom pipes
│   │
│   └── store/                    # NgRx state management
│       └── board/                # Board state (actions, reducers, effects)
│
├── environments/
│   ├── environment.ts            # Dev config (localhost + API Gateway :8080)
│   └── environment.prod.ts       # Production config
│
├── assets/                       # Static files (images, icons)
├── styles.scss                   # Global styles + Tailwind directives
├── index.html                    # Root HTML
└── main.ts                       # Bootstrap entry point
```

---

## Getting Started

### Prerequisites
- **Node.js** 20+
- **npm** 10+
- Backend services running (or API Gateway on port 8080)

### Install & Run

```bash
# Install dependencies
npm install

# Start dev server (with API proxy)
npm start
# → http://localhost:4200
```

### Available Scripts

| Script | Command | Description |
|---|---|---|
| `npm start` | `ng serve --proxy-config proxy.conf.json` | Dev server with API proxy |
| `npm run build` | `ng build --configuration production` | Production build |
| `npm test` | `ng test` | Unit tests (Karma + Jasmine) |
| `npm run test:coverage` | `ng test --watch=false --code-coverage` | Tests with coverage report |
| `npm run test:e2e` | `playwright test` | End-to-end tests |
| `npm run test:e2e:headed` | `playwright test --headed` | E2E tests with browser UI |

---

## Environment Configuration

### Development (`environment.ts`)

All API calls route through the **API Gateway** on port `8080`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1',
  wsUrl: 'http://localhost:8085/ws',
  oauthBaseUrl: 'http://localhost:8081',
  services: {
    auth:         'http://localhost:8080/api/v1',
    workspace:    'http://localhost:8080/api/v1',
    board:        'http://localhost:8080/api/v1',
    // ... all services via gateway
  }
};
```

### Production (`environment.prod.ts`)

Replace URLs with your deployed API Gateway endpoint.

### Proxy Configuration

The `proxy.conf.json` forwards `/api` and `/ws` requests during local development:

```json
{
  "/api":  { "target": "http://localhost:8081" },
  "/ws":   { "target": "http://localhost:8085", "ws": true }
}
```

---

## Docker

Multi-stage build: Node 20 → Nginx Alpine

```bash
# Build image
docker build -t flowboard-frontend .

# Run container
docker run -p 4200:80 flowboard-frontend
```

---

## Architecture Patterns

| Pattern | Implementation |
|---|---|
| **Standalone Components** | All components are standalone (no NgModules) |
| **Lazy Loading** | Every feature route uses `loadComponent()` / `loadChildren()` |
| **NgRx Store** | Centralized state for board data (actions → reducers → effects) |
| **Service-per-Microservice** | One Angular service per backend microservice |
| **Route Guards** | `authGuard` (JWT check), `adminGuard` (role check), `suspensionGuard` |
| **HTTP Interceptor** | Auto-attaches JWT token to outgoing requests |
| **WebSocket (STOMP)** | Real-time card moves & comment updates via `websocket.service.ts` |
| **Strict TypeScript** | `strict: true`, `strictTemplates: true`, `strictInjectionParameters: true` |
