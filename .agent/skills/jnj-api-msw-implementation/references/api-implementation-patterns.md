# API Implementation Patterns

This guide describes the conventions for implementing API functions in JnJ Monarch Hub projects.

---

## Endpoint Definition Pattern

### File Location

Each domain has its own `endpoints.ts` file:

```
src/app/{module}/apis/{domain}/endpoints.ts
```

### Naming Convention

- Use `{DOMAIN}_ENDPOINTS` constant (SCREAMING_SNAKE_CASE)
- Static endpoints: plain strings
- Dynamic endpoints: arrow functions accepting parameters

### Example

```typescript
// src/app/admin/apis/users/endpoints.ts

export const USERS_ENDPOINTS = {
  // Static endpoints
  getUserList: '/users',
  createUser: '/users',
  getHospital: '/users/hospital',
  
  // Dynamic endpoints (with path parameters)
  getUserById: (userId: string) => `/users/${userId}`,
  updateUser: (userId: string) => `/users/${userId}`,
  changeUserStatus: (userId: string) => `/users/${userId}/status`,
  resetUserPassword: (userId: string) => `/users/${userId}/reset-password`,
};
```

### URL Patterns

Follow RESTful conventions:

```
GET    /resource           → list all
POST   /resource           → create new
GET    /resource/{id}      → get one
PUT    /resource/{id}      → update one
DELETE /resource/{id}      → delete one
POST   /resource/{id}/action → custom action
```

---

## API Function Pattern

### File Location

One function per file:

```
src/app/{module}/apis/{domain}/{functionName}.ts
```

### File Structure

```typescript
// 1. Import axios instance
import { userTokenRequiredApi } from '@src/infrastructure/net';

// 2. Import models/types (if shared)
import { User } from '../../models/User';

// 3. Import endpoints
import { USERS_ENDPOINTS } from './endpoints';

// 4. Define request type (inline or imported)
export type CreateUserRequest = {
  username: string;
  password: string;
  role: string;
  departmentId?: string;
};

// 5. Define response type
export type CreateUserResponse = User;

// 6. Export async function
export const createUser = async (
  request: CreateUserRequest
): Promise<CreateUserResponse> => {
  const response = await userTokenRequiredApi.post<CreateUserResponse>(
    USERS_ENDPOINTS.createUser,
    request,
    {
      headers: {
        Accept: 'application/json;v1'  // API versioning
      }
    }
  );
  return response.data;
};
```

---

## HTTP Method Patterns

### GET Request (No Body)

```typescript
export const getUserById = async (userId: string): Promise<User> => {
  const response = await userTokenRequiredApi.get<User>(
    USERS_ENDPOINTS.getUserById(userId),
    {
      headers: { Accept: 'application/json;v1' }
    }
  );
  return response.data;
};
```

### GET Request (With Query Params)

```typescript
export type GetUserListRequest = {
  page?: number;
  limit?: number;
  filter?: string;
  sort?: string;
};

export const getUserList = async (
  params?: GetUserListRequest
): Promise<GetUserListResponse> => {
  const response = await userTokenRequiredApi.get<GetUserListResponse>(
    USERS_ENDPOINTS.getUserList,
    {
      params,  // Axios auto-serializes to query string
      headers: { Accept: 'application/json;v1' }
    }
  );
  return response.data;
};
```

### POST Request (Create)

```typescript
export const createUser = async (
  request: CreateUserRequest
): Promise<User> => {
  const response = await userTokenRequiredApi.post<User>(
    USERS_ENDPOINTS.createUser,
    request,  // Request body
    {
      headers: { Accept: 'application/json;v1' }
    }
  );
  return response.data;
};
```

### PUT Request (Update)

```typescript
export const updateUser = async (
  userId: string,
  request: UpdateUserRequest
): Promise<User> => {
  const response = await userTokenRequiredApi.put<User>(
    USERS_ENDPOINTS.updateUser(userId),  // Dynamic endpoint
    request,
    {
      headers: { Accept: 'application/json;v1' }
    }
  );
  return response.data;
};
```

### DELETE Request

```typescript
export const deleteUser = async (userId: string): Promise<void> => {
  await userTokenRequiredApi.delete(
    USERS_ENDPOINTS.deleteUser(userId),
    {
      headers: { Accept: 'application/json;v1' }
    }
  );
};
```

### File Upload

```typescript
export const uploadReport = async (
  recordId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<Report> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await userTokenRequiredApi.post<Report>(
    ENDPOINTS.uploadReport(recordId),
    formData,
    {
      headers: {
        Accept: 'application/json;v1',
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (event) => {
        if (event.total) {
          onProgress?.(Math.round((event.loaded / event.total) * 100));
        }
      }
    }
  );
  return response.data;
};
```

---

## API Versioning

All requests include the `Accept` header for versioning:

```typescript
headers: { Accept: 'application/json;v1' }  // Version 1
headers: { Accept: 'application/json;v2' }  // Version 2
```

---

## Barrel Exports

### Domain Index

```typescript
// src/app/admin/apis/users/index.ts
export { USERS_ENDPOINTS } from './endpoints';
export { getUserList, type GetUserListResponse } from './getUserList';
export { getUserById } from './getUserById';
export { createUser, type CreateUserRequest, type CreateUserResponse } from './createUser';
export { updateUser, type UpdateUserRequest } from './updateUser';
export { deleteUser } from './deleteUser';
```

### Module Index

```typescript
// src/app/admin/apis/index.ts
export * from './users';
export * from './departments';
```

---

## Type Conventions

### Request Types

- Suffix with `Request`
- Only include fields sent to server
- Use `Pick`, `Omit`, `Partial` for reuse

```typescript
export type CreateUserRequest = Pick<User, 'username' | 'role'> & {
  password: string;
  departmentId?: string;
};

export type UpdateUserRequest = Partial<Omit<User, 'id' | 'createdAt'>>;
```

### Response Types

- Suffix with `Response`
- Can be same as model type
- Define inline if simple

```typescript
export type CreateUserResponse = User;

export type GetUserListResponse = {
  data: User[];
  total: number;
  page: number;
  limit: number;
};
```

---

## Common Patterns

### Response Transformation

```typescript
export const getDeviceToken = async (): Promise<DeviceToken> => {
  const response = await authApi.get<DeviceTokenResponse>(
    ENDPOINTS.getDeviceToken,
    { headers: { Accept: 'application/json;v1' } }
  );
  
  // Transform response
  return {
    deviceToken: response.data.token
  };
};
```

### Error Re-throwing

```typescript
export const riskyOperation = async (): Promise<Result> => {
  try {
    const response = await userTokenRequiredApi.post<Result>(
      ENDPOINTS.riskyOperation,
      {},
      { headers: { Accept: 'application/json;v1' } }
    );
    return response.data;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 409) {
      throw new ConflictError('Resource already exists');
    }
    throw error;
  }
};
```

---

## Reference Files

Existing implementations to study:

| Module | Location |
|--------|----------|
| Auth | `src/app/auth/apis/userToken/` |
| Admin Users | `src/app/admin/apis/users/` |
| Admin Departments | `src/app/admin/apis/departments/` |
| Surgery Center | `src/app/surgeryCenter/apis/surgery/` |
| Research Center | `src/app/researchCenter/apis/research/` |
