---
name: jnj-api-msw-implementation
description: Create or update APIs and MSW mock handlers in JnJ projects following established conventions and patterns.
version: 1.0.0
---

# JnJ API & MSW Implementation

This skill is for **creating or updating APIs and MSW mock handlers** in JnJ projects, ensuring all implementations strictly follow the agreed-upon **conventions, best practices, and patterns**.

## Arguments

- **default** (no argument needed): Execute the full workflow process (steps 1-6)
- **plan**: Execute planning phase only (steps 1-4) - analyze requirements, determine APIs needed, audit existing implementation, and produce implementation report
- **impl**: Execute implementation phase only (step 5) - check context for existing report or proposed design from step 4; if not found, ask user for clarification
- **mock**: Execute mock implementation only (step 6) - create MSW handlers for existing APIs

## When to Use

Use this agent when:

- The user requests adding or updating **API endpoints** for:
  - a feature
  - a module
  - a backend integration
- The user requests adding or updating **MSW mock handlers**
- The user explicitly invokes the command: `/jnj-api-msw-implementation`

## API-Related Best Practices and Patterns

### 1. HTTP Client Infrastructure

**Load**: `references/http-client-infrastructure.md`

**Purpose**:

- Understand the 3 Axios instances and when to use each
- Learn about token management and interceptors
- Know the base URL configuration

**Skip if:** The user already specifies which Axios instance to use

### 2. API Implementation Patterns

**Load**: `references/api-implementation-patterns.md`

**Purpose**:

- Understand endpoint definition conventions
- Learn API function implementation patterns
- Ensure consistent file structure

**Skip if:** The user explicitly specifies the API pattern to use

### 3. MSW Mock Patterns

**Load**: `references/msw-mock-patterns.md`

**Purpose**:

- Understand MSW handler structure
- Learn mock data management
- Ensure consistent mock implementation

**Skip if:** The user only needs real API (no mocks)

### 4. Directory Structure

**Load**: `references/directory-structure.md`

**Purpose**:

- Understand the file organization convention
- Know where to place new files
- Maintain consistent module structure

## Workflow Process

1. Analyze the user request
   - Identify the relevant feature or module
   - Understand the API requirements and scope
2. Determine required APIs
   - Identify which endpoints need to be created/updated
   - Determine HTTP methods (GET, POST, PUT, DELETE)
   - Define request/response types
3. Audit existing implementation
   - Check if similar APIs already exist
   - Identify patterns from the target module
   - Find related mock handlers
4. Produce an implementation report into markdown file
   - Document required endpoints
   - Propose technical design for each API
   - Present the result as a Markdown document
   - Review and confirm the approach with the user
5. Implement APIs
   - Create/update endpoint definitions
   - Implement API functions with proper types
   - Export from barrel files
6. Implement MSW mocks
   - Create mock handlers mirroring real APIs
   - Set up mock data if needed
   - Register handlers in aggregation files

## Report Format (for Step 4)

**Template:** `references/api-report-template.md`

**Output path:** `specs/{{feature-name}}/api.report.md`

The report template includes the following sections:

1. **Relevant Files** - List of files involved in the implementation
2. **API Table** - Summary table of all endpoints with methods and status
3. **Technical Design** - Detailed implementation code for each API
4. **Mock Design** - Mock handler implementation code
5. **Type Definitions** - Request/Response types
6. **Notes** - Implementation considerations

## Quick Reference

### Axios Instances

| Instance | Base URL | Use For |
|----------|----------|---------|
| `authApi` | `/auth/api` | Authentication APIs |
| `userTokenRequiredApi` | `/core/api` | User-authenticated APIs |
| `deviceTokenRequiredApi` | `/core/api` | Device-authenticated APIs |

### File Naming Convention

```
src/app/{module}/apis/
├── index.ts                    # Barrel export
├── {domain}/
│   ├── index.ts                # Domain barrel export
│   ├── endpoints.ts            # Endpoint constants
│   └── {functionName}.ts       # API function (camelCase)
└── mocks/
    ├── index.ts                # Handler aggregation
    ├── database.ts             # Mock data (optional)
    └── {domain}/
        ├── index.ts            # Handler exports
        └── {functionName}.ts   # Mock handler
```

### API Function Template

```typescript
import { userTokenRequiredApi } from '@src/infrastructure/net';
import { DOMAIN_ENDPOINTS } from './endpoints';

export type RequestType = { /* ... */ };
export type ResponseType = { /* ... */ };

export const functionName = async (params: RequestType): Promise<ResponseType> => {
  const response = await userTokenRequiredApi.method<ResponseType>(
    DOMAIN_ENDPOINTS.endpointName,
    /* body if POST/PUT */,
    { headers: { Accept: 'application/json;v1' } }
  );
  return response.data;
};
```

### Mock Handler Template

```typescript
import { http, HttpResponse } from 'msw';
import { userTokenRequiredApi } from '@src/infrastructure/net';
import { DOMAIN_ENDPOINTS } from '../../{domain}/endpoints';

export const functionNameHandler = http.method(
  userTokenRequiredApi.defaults.baseURL + DOMAIN_ENDPOINTS.endpointName,
  async ({ request, params }) => {
    // Handle request
    return HttpResponse.json(data, { status: 200 });
  }
);
```

## References

- `references/http-client-infrastructure.md` - Axios instances and token management
- `references/api-implementation-patterns.md` - API function conventions
- `references/msw-mock-patterns.md` - MSW handler patterns
- `references/directory-structure.md` - File organization
- `references/api-report-template.md` - Template for implementation reports
