# API Implementation Report Template

Use this template when producing implementation reports (Step 4 of the workflow).

---

## Output Path

Save the report to: `specs/{{feature-name}}/api.report.md`

---

## Template

```markdown
# API Implementation Report: {{Feature Name}}

**Date:** {{YYYY-MM-DD}}
**Module:** {{module-name}}
**Status:** Draft | Approved | Implemented

---

## 1. Relevant Files

### Existing Files (to modify)

| File | Purpose |
|------|---------|
| `src/app/{{module}}/apis/{{domain}}/endpoints.ts` | Add new endpoints |
| `src/app/{{module}}/apis/{{domain}}/index.ts` | Export new functions |
| `src/app/{{module}}/apis/mocks/{{domain}}/index.ts` | Export new handlers |

### New Files (to create)

| File | Purpose |
|------|---------|
| `src/app/{{module}}/apis/{{domain}}/{{functionName}}.ts` | API function |
| `src/app/{{module}}/apis/mocks/{{domain}}/{{functionName}}.ts` | Mock handler |

---

## 2. API Table

| Endpoint | Method | Function | Mock | Status |
|----------|--------|----------|------|--------|
| `/resource` | GET | `getResourceList` | Yes | New |
| `/resource/:id` | GET | `getResourceById` | Yes | New |
| `/resource` | POST | `createResource` | Yes | New |
| `/resource/:id` | PUT | `updateResource` | Yes | New |
| `/resource/:id` | DELETE | `deleteResource` | Yes | New |

**Status Legend:**
- New: To be implemented
- Existing: Already implemented
- Update: Needs modification

---

## 3. Technical Design

### 3.1 Endpoints Definition

```typescript
// src/app/{{module}}/apis/{{domain}}/endpoints.ts

export const {{DOMAIN}}_ENDPOINTS = {
  // ... existing endpoints ...
  
  // New endpoints
  getResourceList: '/resources',
  createResource: '/resources',
  getResourceById: (resourceId: string) => `/resources/${resourceId}`,
  updateResource: (resourceId: string) => `/resources/${resourceId}`,
  deleteResource: (resourceId: string) => `/resources/${resourceId}`,
};
```

### 3.2 API Functions

#### getResourceList

```typescript
// src/app/{{module}}/apis/{{domain}}/getResourceList.ts

import { userTokenRequiredApi } from '@src/infrastructure/net';
import { {{DOMAIN}}_ENDPOINTS } from './endpoints';
import { Resource } from '../../models/Resource';

export type GetResourceListRequest = {
  page?: number;
  limit?: number;
  filter?: string;
};

export type GetResourceListResponse = {
  data: Resource[];
  total: number;
  page: number;
  limit: number;
};

export const getResourceList = async (
  params?: GetResourceListRequest
): Promise<GetResourceListResponse> => {
  const response = await userTokenRequiredApi.get<GetResourceListResponse>(
    {{DOMAIN}}_ENDPOINTS.getResourceList,
    {
      params,
      headers: { Accept: 'application/json;v1' }
    }
  );
  return response.data;
};
```

#### createResource

```typescript
// src/app/{{module}}/apis/{{domain}}/createResource.ts

import { userTokenRequiredApi } from '@src/infrastructure/net';
import { {{DOMAIN}}_ENDPOINTS } from './endpoints';
import { Resource } from '../../models/Resource';

export type CreateResourceRequest = {
  name: string;
  description?: string;
  // ... other fields
};

export type CreateResourceResponse = Resource;

export const createResource = async (
  request: CreateResourceRequest
): Promise<CreateResourceResponse> => {
  const response = await userTokenRequiredApi.post<CreateResourceResponse>(
    {{DOMAIN}}_ENDPOINTS.createResource,
    request,
    { headers: { Accept: 'application/json;v1' } }
  );
  return response.data;
};
```

<!-- Add more API functions as needed -->

---

## 4. Mock Design

### 4.1 Mock Data

```typescript
// src/app/{{module}}/apis/mocks/database.ts (or resources.ts)

import { Resource } from '../../models/Resource';

export const resources: Resource[] = [
  {
    id: 'res-1',
    name: 'Resource 1',
    description: 'First resource',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'res-2',
    name: 'Resource 2',
    description: 'Second resource',
    createdAt: '2025-01-02T00:00:00.000Z',
    updatedAt: '2025-01-02T00:00:00.000Z'
  }
];
```

### 4.2 Mock Handlers

#### getResourceListHandler

```typescript
// src/app/{{module}}/apis/mocks/{{domain}}/getResourceList.ts

import { http, HttpResponse } from 'msw';
import { userTokenRequiredApi } from '@src/infrastructure/net';
import { {{DOMAIN}}_ENDPOINTS } from '../../{{domain}}/endpoints';
import { resources } from '../database';

export const getResourceListHandler = http.get(
  userTokenRequiredApi.defaults.baseURL + {{DOMAIN}}_ENDPOINTS.getResourceList,
  async ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    const start = (page - 1) * limit;
    const paginated = resources.slice(start, start + limit);
    
    return HttpResponse.json({
      data: paginated,
      total: resources.length,
      page,
      limit
    });
  }
);
```

#### createResourceHandler

```typescript
// src/app/{{module}}/apis/mocks/{{domain}}/createResource.ts

import { http, HttpResponse } from 'msw';
import { userTokenRequiredApi } from '@src/infrastructure/net';
import { {{DOMAIN}}_ENDPOINTS } from '../../{{domain}}/endpoints';
import { resources } from '../database';
import type { CreateResourceRequest } from '../../{{domain}}/createResource';

export const createResourceHandler = http.post<never, CreateResourceRequest>(
  userTokenRequiredApi.defaults.baseURL + {{DOMAIN}}_ENDPOINTS.createResource,
  async ({ request }) => {
    const body = await request.json();
    
    if (!body.name) {
      return HttpResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }
    
    const newResource = {
      id: crypto.randomUUID(),
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    resources.push(newResource);
    
    return HttpResponse.json(newResource, { status: 201 });
  }
);
```

<!-- Add more handlers as needed -->

### 4.3 Handler Exports

```typescript
// src/app/{{module}}/apis/mocks/{{domain}}/index.ts

import { getResourceListHandler } from './getResourceList';
import { getResourceByIdHandler } from './getResourceById';
import { createResourceHandler } from './createResource';
import { updateResourceHandler } from './updateResource';
import { deleteResourceHandler } from './deleteResource';

export const {{domain}}Handlers = [
  getResourceListHandler,
  getResourceByIdHandler,
  createResourceHandler,
  updateResourceHandler,
  deleteResourceHandler
];
```

---

## 5. Type Definitions

```typescript
// src/app/{{module}}/models/Resource.ts

export type Resource = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};
```

---

## 6. Barrel Export Updates

### API Domain Index

```typescript
// src/app/{{module}}/apis/{{domain}}/index.ts

// ... existing exports ...

// New exports
export { getResourceList, type GetResourceListRequest, type GetResourceListResponse } from './getResourceList';
export { getResourceById } from './getResourceById';
export { createResource, type CreateResourceRequest, type CreateResourceResponse } from './createResource';
export { updateResource, type UpdateResourceRequest } from './updateResource';
export { deleteResource } from './deleteResource';
```

### Mock Module Index

```typescript
// src/app/{{module}}/apis/mocks/index.ts

import { {{domain}}Handlers } from './{{domain}}';
// ... existing imports ...

export const {{module}}Handlers = [
  ...{{domain}}Handlers,
  // ... existing handlers ...
];
```

---

## 7. Notes

### Implementation Considerations

- [ ] Consider pagination requirements
- [ ] Determine if filtering/sorting is needed
- [ ] Check if optimistic updates are required
- [ ] Verify error handling requirements

### Dependencies

- Uses `userTokenRequiredApi` (requires user authentication)
- Integrates with existing `{{module}}` module

### Questions

- Q1: [Any open questions for the user]
- Q2: [Any clarifications needed]

---

## Approval

- [ ] User approved the design
- [ ] Ready for implementation
```

---

## Example Usage

When generating a report, replace all `{{placeholders}}`:

- `{{Feature Name}}` → "Patient Management"
- `{{module}}` → "researchCenter"
- `{{domain}}` → "patients"
- `{{DOMAIN}}` → "PATIENTS"
- `{{functionName}}` → "getPatientList"
