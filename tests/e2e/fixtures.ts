import { Page } from '@playwright/test';

const CURRENT_USER = {
  id: 7,
  fullName: 'Priya Desai',
  email: 'priya@example.com',
  username: 'priya',
  role: 'MEMBER',
  provider: 'LOCAL',
  isActive: true,
  createdAt: '2026-04-20T09:00:00Z',
};

const WORKSPACES = [
  {
    id: 101,
    name: 'Product Studio',
    description: 'Shipping polished work across design and engineering.',
    ownerId: 7,
    visibility: 'PRIVATE',
    members: [
      { id: 1, userId: 7, workspaceId: 101, role: 'ADMIN', joinedAt: '2026-04-20T09:00:00Z' },
      { id: 2, userId: 9, workspaceId: 101, role: 'MEMBER', joinedAt: '2026-04-21T09:00:00Z' },
    ],
    createdAt: '2026-04-20T09:00:00Z',
  },
  {
    id: 102,
    name: 'Marketing Launch',
    description: '',
    ownerId: 7,
    visibility: 'PUBLIC',
    members: [
      { id: 3, userId: 7, workspaceId: 102, role: 'ADMIN', joinedAt: '2026-04-22T09:00:00Z' },
    ],
    createdAt: '2026-04-22T09:00:00Z',
  },
];

const BOARDS = [
  {
    id: 301,
    name: 'Q2 Roadmap',
    description: 'Cross-team execution for the quarter.',
    workspaceId: 101,
    createdById: 7,
    background: 'linear-gradient(135deg, #0f172a, #0369a1)',
    visibility: 'PRIVATE',
    isClosed: false,
    members: [
      { id: 11, userId: 7, boardId: 301, role: 'ADMIN', addedAt: '2026-04-20T09:00:00Z' },
      { id: 12, userId: 9, boardId: 301, role: 'MEMBER', addedAt: '2026-04-21T09:00:00Z' },
    ],
    createdAt: '2026-04-20T09:00:00Z',
  },
  {
    id: 302,
    name: 'Launch Checklist',
    description: '',
    workspaceId: 102,
    createdById: 7,
    background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
    visibility: 'PUBLIC',
    isClosed: false,
    members: [
      { id: 13, userId: 7, boardId: 302, role: 'ADMIN', addedAt: '2026-04-22T09:00:00Z' },
    ],
    createdAt: '2026-04-22T09:00:00Z',
  },
  {
    id: 401,
    name: 'Client Shared Board',
    description: 'Visible through direct board collaboration.',
    workspaceId: 999,
    createdById: 12,
    background: 'linear-gradient(135deg, #166534, #0f766e)',
    visibility: 'PRIVATE',
    isClosed: false,
    members: [
      { id: 14, userId: 7, boardId: 401, role: 'MEMBER', addedAt: '2026-04-24T09:00:00Z' },
      { id: 15, userId: 12, boardId: 401, role: 'ADMIN', addedAt: '2026-04-24T09:00:00Z' },
    ],
    createdAt: '2026-04-24T09:00:00Z',
  },
];

export async function mockGuestApi(page: Page): Promise<void> {
  await page.route('**/api/v1/workspaces/public', async (route) => {
    await route.fulfill({ json: WORKSPACES });
  });
}

export async function mockAuthenticatedApi(page: Page): Promise<void> {
  await page.route('**/api/v1/workspaces/my', async (route) => {
    await route.fulfill({ json: WORKSPACES });
  });

  await page.route('**/api/v1/boards/my', async (route) => {
    await route.fulfill({ json: BOARDS });
  });

  await page.route('**/api/v1/payments/summary', async (route) => {
    await route.fulfill({ json: { premium: false, activeSubscription: null, lastPayment: null } });
  });

  await page.route('**/api/v1/notifications/unread-count', async (route) => {
    await route.fulfill({ json: { count: 2 } });
  });
}

export async function mockOtpLoginApi(page: Page): Promise<void> {
  await page.route('**/api/v1/auth/login/request-otp', async (route) => {
    const body = route.request().postDataJSON() as { email: string };
    await route.fulfill({
      json: {
        message: `Verification code sent to ${body.email}`,
        expiresInSeconds: 300,
      },
    });
  });

  await page.route('**/api/v1/auth/login/verify-otp', async (route) => {
    const body = route.request().postDataJSON() as { email: string; otp: string };
    await route.fulfill({
      json: {
        accessToken: 'playwright-token',
        tokenType: 'Bearer',
        user: {
          ...CURRENT_USER,
          email: body.email,
        },
      },
    });
  });

  await mockAuthenticatedApi(page);
}

export async function seedAuthenticatedSession(page: Page): Promise<void> {
  await page.addInitScript((storage: { tokenKey: string; userKey: string; user: typeof CURRENT_USER }) => {
    const { tokenKey, userKey, user } = storage;
    window.localStorage.setItem(tokenKey, 'playwright-token');
    window.localStorage.setItem(userKey, JSON.stringify(user));
  }, { tokenKey: 'flowboard_token', userKey: 'flowboard_user', user: CURRENT_USER });
}
