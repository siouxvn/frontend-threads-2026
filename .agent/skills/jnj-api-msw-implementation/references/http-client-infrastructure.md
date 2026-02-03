# HTTP Client Infrastructure

This guide describes the HTTP client configuration used in JnJ Monarch Hub projects.

---

## Axios Instances

The project uses **three separate Axios instances** for different API domains, located in `src/infrastructure/net/`:

### 1. authApi

**File:** `src/infrastructure/net/authApi.ts`

**Base URL:** `/auth/api`

**Use for:** Authentication endpoints (login, logout, token refresh, password update)

```typescript
import { authApi } from '@src/infrastructure/net';

// Example usage
const response = await authApi.post('/login', { username, password });
```

### 2. userTokenRequiredApi

**File:** `src/infrastructure/net/userTokenRequiredApi.ts`

**Base URL:** `/core/api`

**Use for:** All user-authenticated API calls (most common)

```typescript
import { userTokenRequiredApi } from '@src/infrastructure/net';

// Example usage
const response = await userTokenRequiredApi.get('/users');
```

### 3. deviceTokenRequiredApi

**File:** `src/infrastructure/net/deviceTokenRequiredApi.ts`

**Base URL:** `/core/api`

**Use for:** Device-authenticated API calls (special use cases)

```typescript
import { deviceTokenRequiredApi } from '@src/infrastructure/net';

// Example usage
const response = await deviceTokenRequiredApi.get('/device/status');
```

---

## Base URL Variables

Defined in `src/infrastructure/variables.ts`:

```typescript
export const authPrefix = '/auth/api';
export const corePrefix = '/core/api';
export const coreEventPrefix = '/core/event';
export const videoProcessorPrefix = '/video-processor';
```

---

## Token Management

### TokenManager Class

**File:** `src/infrastructure/net/tokenManager.ts`

The `TokenManager` provides:

1. **Request Interceptor** - Automatically injects Bearer token
2. **Proactive Refresh** - Monitors token expiry and refreshes before expiration
3. **Configurable Options** - `refreshBufferTime`, `minRefreshInterval`, `tokenCheckInterval`

### How it works

```typescript
// In main.tsx
function setupTokenManagers() {
  userTokenManager.register(authApi);
  userTokenManager.register(userTokenRequiredApi);
  deviceTokenManager.register(deviceTokenRequiredApi);
}
```

### Interceptor Implementation

```typescript
public register(instance: AxiosInstance) {
  instance.interceptors.request.use(axiosConfig => {
    const token = this.deps?.getRepository().getAccessToken();
    if (token) {
      axiosConfig.headers = axiosConfig.headers ?? {};
      axiosConfig.headers.Authorization = `Bearer ${token}`;
    }
    return axiosConfig;
  });
}
```

---

## Error Handling

### React Query Configuration

**File:** `src/infrastructure/queryClient.ts`

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,      // 5 minutes
      gcTime: 10 * 60 * 1000,        // 10 minutes
      retry: (failureCount, error) => {
        // No retry for 4xx client errors
        if (error?.response?.status >= 400 && error.response.status < 500) {
          return false;
        }
        return failureCount < 3;      // Retry up to 3 times
      }
    }
  }
});
```

### Auth Error Handling

```typescript
// In userAuthService.ts
async refreshAccessToken(): Promise<string | null> {
  try {
    const response = await userRefresh({ refreshToken });
    // ... store tokens
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        this.logout();  // Force logout on auth failure
        return Promise.resolve(null);
      }
    }
    throw error;
  }
}
```

---

## Proxy Configuration

Configured in `vite.config.ts` for development:

| Path | Target | Purpose |
|------|--------|---------|
| `/auth/api` | `PROXY_URL_WEB_BACKEND` | Authentication APIs |
| `/core/api` | `PROXY_URL_WEB_BACKEND` | Core business APIs |
| `/core/event` | `PROXY_URL_WEB_BACKEND` | WebSocket events |
| `/video-processor` | `PROXY_URL_VIDEO_PROCESSOR` | Video processing APIs |
| `/resource` | `PROXY_URL` | Static resources |

---

## Decision Guide: Which Instance to Use?

| Scenario | Axios Instance |
|----------|---------------|
| Login/logout/refresh token | `authApi` |
| User management, surgeries, patients | `userTokenRequiredApi` |
| Device-specific operations | `deviceTokenRequiredApi` |
| Any `/auth/api/*` endpoint | `authApi` |
| Any `/core/api/*` endpoint (user auth) | `userTokenRequiredApi` |
| Any `/core/api/*` endpoint (device auth) | `deviceTokenRequiredApi` |
