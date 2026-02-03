# MSW Mock Patterns

This guide describes the conventions for implementing MSW (Mock Service Worker) handlers in JnJ Monarch Hub projects.

---

## MSW Setup

### Conditional Loading

Mocks are loaded only in mock mode (`yarn dev:mock`):

```typescript
// src/main.tsx
if (import.meta.env.MODE === 'mock') {
  const { setupApiMocks } = await import('./mocks/apiMocks');
  const { setupSocketMocks } = await import('./mocks/socketMocks');
  
  await setupApiMocks();
  setupSocketMocks();
}
```

### Handler Aggregation

```typescript
// src/mocks/apiMocks.ts
export const setupApiMocks = async () => {
  const { setupWorker } = await import('msw/browser');
  const { adminHandlers } = await import('@src/app/admin/apis/mocks');
  const { authHandlers } = await import('@src/app/auth/apis/mocks');
  const { surgeryCenterHandlers } = await import('@src/app/surgeryCenter/apis/mocks');
  // ... more handlers
  
  await setupWorker(
    ...authHandlers,
    ...adminHandlers,
    ...surgeryCenterHandlers,
    // ... all handlers
  ).start({
    onUnhandledRequest: 'bypass',  // Allow unmocked requests through
  });
};
```

---

## Mock Handler Patterns

### Basic Structure

```typescript
import { http, HttpResponse } from 'msw';
import { userTokenRequiredApi } from '@src/infrastructure/net';
import { USERS_ENDPOINTS } from '../../users/endpoints';

export const getUserByIdHandler = http.get<
  { userId: string },      // Path params type
  never,                   // Request body type (never for GET)
  User | null              // Response type
>(
  userTokenRequiredApi.defaults.baseURL + USERS_ENDPOINTS.getUserById(':userId'),
  async ({ params }) => {
    const { userId } = params;
    // ... handler logic
    return HttpResponse.json(user, { status: 200 });
  }
);
```

### URL Construction

Always construct URLs by combining `baseURL` with endpoint:

```typescript
// ✅ Correct
userTokenRequiredApi.defaults.baseURL + USERS_ENDPOINTS.getUserById(':userId')
// Results in: /core/api/users/:userId

// ❌ Wrong - hardcoded URL
'/core/api/users/:userId'
```

### Path Parameters

Use `:paramName` syntax (MSW convention):

```typescript
// For endpoint: getUserById: (userId: string) => `/users/${userId}`
// Use: USERS_ENDPOINTS.getUserById(':userId')

// Access in handler:
async ({ params }) => {
  const { userId } = params;  // Extracted from URL
}
```

---

## Handler Types

### GET Handler (List)

```typescript
export const getUserListHandler = http.get<never, never, GetUserListResponse>(
  userTokenRequiredApi.defaults.baseURL + USERS_ENDPOINTS.getUserList,
  async ({ request }) => {
    // Parse query params
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const filter = url.searchParams.get('filter');
    const sort = url.searchParams.get('sort');
    
    // Apply filtering (example)
    let filtered = [...users];
    if (filter) {
      filtered = filtered.filter(u => u.username.includes(filter));
    }
    
    // Apply sorting (example)
    if (sort) {
      const [field, order] = sort.split(':');
      filtered.sort((a, b) => {
        const cmp = String(a[field]).localeCompare(String(b[field]));
        return order === 'desc' ? -cmp : cmp;
      });
    }
    
    // Apply pagination
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);
    
    return HttpResponse.json({
      data: paginated,
      total: filtered.length,
      page,
      limit
    });
  }
);
```

### GET Handler (Single Item)

```typescript
export const getUserByIdHandler = http.get<{ userId: string }, never, User | null>(
  userTokenRequiredApi.defaults.baseURL + USERS_ENDPOINTS.getUserById(':userId'),
  async ({ params }) => {
    const { userId } = params;
    
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return HttpResponse.json(null, { status: 404 });
    }
    
    return HttpResponse.json(user);
  }
);
```

### POST Handler (Create)

```typescript
export const createUserHandler = http.post<never, CreateUserRequest, User>(
  userTokenRequiredApi.defaults.baseURL + USERS_ENDPOINTS.createUser,
  async ({ request }) => {
    const body = await request.json();
    
    // Validation
    if (!body.username || !body.password) {
      return HttpResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check for duplicates
    if (users.some(u => u.username === body.username)) {
      return HttpResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }
    
    // Create new user
    const newUser: User = {
      id: crypto.randomUUID(),
      username: body.username,
      displayName: body.username,
      role: body.role,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    users.push(newUser);
    
    return HttpResponse.json(newUser, { status: 201 });
  }
);
```

### PUT Handler (Update)

```typescript
export const updateUserHandler = http.put<
  { userId: string },
  UpdateUserRequest,
  User | null
>(
  userTokenRequiredApi.defaults.baseURL + USERS_ENDPOINTS.updateUser(':userId'),
  async ({ params, request }) => {
    const { userId } = params;
    const body = await request.json();
    
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return HttpResponse.json(null, { status: 404 });
    }
    
    // Update user in-place
    users[userIndex] = {
      ...users[userIndex],
      ...body,
      updatedAt: new Date().toISOString()
    };
    
    return HttpResponse.json(users[userIndex]);
  }
);
```

### DELETE Handler

```typescript
export const deleteUserHandler = http.delete<{ userId: string }, never, null>(
  userTokenRequiredApi.defaults.baseURL + USERS_ENDPOINTS.deleteUser(':userId'),
  async ({ params }) => {
    const { userId } = params;
    
    const index = users.findIndex(u => u.id === userId);
    
    if (index === -1) {
      return HttpResponse.json(null, { status: 404 });
    }
    
    users.splice(index, 1);
    
    return HttpResponse.json(null, { status: 204 });
  }
);
```

---

## Mock Data Management

### Database File

Create a `database.ts` for shared mock data:

```typescript
// src/app/admin/apis/mocks/database.ts
import { User, Role } from '../../models/User';
import { Department } from '../../models/Department';

// Mutable arrays as in-memory "tables"
export const users: User[] = [
  {
    id: 'user-1',
    username: 'admin',
    displayName: 'Admin User',
    role: Role.Admin,
    isActive: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'user-2',
    username: 'doctor',
    displayName: 'Dr. Smith',
    role: Role.User,
    isActive: true,
    createdAt: '2025-01-02T00:00:00.000Z',
    updatedAt: '2025-01-02T00:00:00.000Z'
  }
];

export const departments: Department[] = [
  {
    id: 'dept-1',
    name: 'Cardiology',
    isActive: true,
    surgeryTypes: []
  }
];
```

### Dynamic Data Generation

For large datasets:

```typescript
// Generate random data
const generateUser = (index: number): User => ({
  id: `user-${index}`,
  username: `user${index}`,
  displayName: `User ${index}`,
  role: Math.random() > 0.5 ? Role.User : Role.Chief,
  isActive: Math.random() > 0.2,
  createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString()
});

export const users: User[] = Array.from({ length: 50 }, (_, i) => generateUser(i));
```

### In-Memory State

For complex scenarios:

```typescript
// Persistent mock store
export const mockReportsStore = new Map<string, Report[]>();

// In handler
export const uploadReportHandler = http.post(url, async ({ params, request }) => {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  const report: Report = {
    id: crypto.randomUUID(),
    name: file.name,
    url: URL.createObjectURL(file),
    uploadedAt: new Date().toISOString()
  };
  
  const existing = mockReportsStore.get(params.recordId) || [];
  mockReportsStore.set(params.recordId, [...existing, report]);
  
  return HttpResponse.json(report, { status: 201 });
});
```

---

## Handler Export Pattern

### Per-Domain Index

```typescript
// src/app/admin/apis/mocks/users/index.ts
import { getUserListHandler } from './getUserList';
import { getUserByIdHandler } from './getUserById';
import { createUserHandler } from './createUser';
import { updateUserHandler } from './updateUser';
import { deleteUserHandler } from './deleteUser';

export const usersHandlers = [
  getUserListHandler,
  getUserByIdHandler,
  createUserHandler,
  updateUserHandler,
  deleteUserHandler
];
```

### Module Index

```typescript
// src/app/admin/apis/mocks/index.ts
import { usersHandlers } from './users';
import { departmentsHandlers } from './departments';

export const adminHandlers = [
  ...usersHandlers,
  ...departmentsHandlers
];
```

---

## Advanced Patterns

### API Version Differentiation

```typescript
export const getUserListHandler = http.get(url, async ({ request }) => {
  const version = request.headers.get('Accept');
  
  if (version?.includes('v2')) {
    // Return v2 format with pagination
    return HttpResponse.json({
      data: users,
      pagination: { page: 1, total: users.length }
    });
  }
  
  // Return v1 format (simple array)
  return HttpResponse.json(users);
});
```

### Simulating Delays

```typescript
import { delay } from 'msw';

export const slowHandler = http.get(url, async () => {
  await delay(500);  // 500ms delay
  return HttpResponse.json(data);
});
```

### Simulating Errors

```typescript
export const errorHandler = http.get(url, async ({ request }) => {
  const url = new URL(request.url);
  
  // Simulate random errors for testing
  if (url.searchParams.get('simulateError') === 'true') {
    return HttpResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
  
  return HttpResponse.json(data);
});
```

---

## Mock JWT Utilities

For auth mocks, use `src/infrastructure/net/mockJWT.ts`:

```typescript
import {
  generateAccessToken,
  generateRefreshToken,
  verifyBearerAccessToken
} from '@src/infrastructure/net/mockJWT';

export const loginHandler = http.post(url, async ({ request }) => {
  const { username, password } = await request.json();
  
  const user = users.find(u => u.username === username);
  
  if (!user || user.password !== password) {
    return HttpResponse.json(null, { status: 401 });
  }
  
  return HttpResponse.json({
    userId: user.id,
    username: user.username,
    accessToken: await generateAccessToken(),   // 1 hour expiry
    refreshToken: await generateRefreshToken(), // 7 days expiry
    expiresIn: 3600
  });
});
```

---

## Checklist

Before submitting mock handlers:

- [ ] URL constructed from `axios.defaults.baseURL + endpoint`
- [ ] Path params use `:paramName` syntax
- [ ] Handler uses correct HTTP method
- [ ] TypeScript generics defined for params/body/response
- [ ] Error cases return appropriate status codes
- [ ] Handler exported in domain index
- [ ] Domain handlers exported in module index
- [ ] Mock data realistic and typed
