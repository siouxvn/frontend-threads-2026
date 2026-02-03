# Directory Structure

This guide describes the file organization conventions for APIs and mocks in JnJ Monarch Hub projects.

---

## Module Structure Overview

Each feature module follows this structure:

```
src/app/{module}/
├── apis/                       # API layer
│   ├── index.ts                # Module barrel export
│   ├── {domain}/               # Domain-specific APIs
│   │   ├── index.ts            # Domain barrel export
│   │   ├── endpoints.ts        # Endpoint constants
│   │   ├── dto.ts              # Types (optional, if many)
│   │   └── {functionName}.ts   # API functions (one per file)
│   └── mocks/                  # MSW mock handlers
│       ├── index.ts            # Handler aggregation
│       ├── database.ts         # Mock data store (optional)
│       └── {domain}/           # Domain-specific handlers
│           ├── index.ts        # Handler exports
│           └── {functionName}.ts
├── components/                 # React components
├── hooks/                      # Custom hooks
├── models/                     # TypeScript types/interfaces
├── services/                   # Business logic services
└── events.ts                   # Event tracking definitions
```

---

## Real Example: Admin Module

```
src/app/admin/
├── apis/
│   ├── index.ts                        # exports users + departments
│   ├── users/
│   │   ├── index.ts                    # barrel export
│   │   ├── endpoints.ts                # USERS_ENDPOINTS
│   │   ├── createUser.ts
│   │   ├── getUserList.ts
│   │   ├── getUserListPaginated.ts
│   │   ├── getUserById.ts
│   │   ├── updateUser.ts
│   │   ├── changeUserStatus.ts
│   │   ├── resetUserPassword.ts
│   │   └── getHospital.ts
│   ├── departments/
│   │   ├── index.ts
│   │   ├── endpoints.ts                # DEPARTMENTS_ENDPOINTS
│   │   ├── getDepartments.ts
│   │   ├── createDepartments.ts
│   │   ├── changeDeparmentStatus.ts
│   │   ├── deleteDepartment.ts
│   │   ├── getSurgeryTypesByDepartmentId.ts
│   │   ├── createSurgeryTypesByDepartmentId.ts
│   │   ├── changeSurgeryTypeStatusByDepartmentId.ts
│   │   └── deleteSurgeryType.ts
│   └── mocks/
│       ├── index.ts                    # exports adminHandlers
│       ├── database.ts                 # users[], departments[]
│       ├── users/
│       │   ├── index.ts                # exports usersHandlers
│       │   ├── createUser.ts
│       │   ├── getUserList.ts
│       │   ├── getUserById.ts
│       │   ├── updateUser.ts
│       │   ├── changeUserStatus.ts
│       │   ├── resetUserPassword.ts
│       │   └── getHospital.ts
│       └── departments/
│           ├── index.ts                # exports departmentsHandlers
│           ├── getDepartments.ts
│           ├── createDepartments.ts
│           ├── changeDepartmentStatus.ts
│           ├── deleteDepartment.ts
│           ├── getSurgeryTypesByDepartmentId.ts
│           ├── createSurgeryTypesByDepartmentId.ts
│           ├── changeSurgeryTypeStatusByDepartmentId.ts
│           └── deleteSurgeryType.ts
├── components/
├── hooks/
├── models/
│   ├── User.ts
│   └── Department.ts
└── events.ts
```

---

## Real Example: Surgery Center Module

```
src/app/surgeryCenter/
├── apis/
│   ├── index.ts                        # exports surgery + storage
│   ├── surgery/
│   │   ├── index.ts
│   │   ├── endpoints.ts                # SURGERY_ENDPOINTS
│   │   ├── getSurgeryList.ts
│   │   ├── getSurgeryDetails.ts
│   │   ├── getSurgeryFilters.ts
│   │   ├── getSurgeryFormSchema.ts
│   │   ├── putSurgery.ts
│   │   ├── deleteSurgery.ts
│   │   ├── getSurgeryVideoDownloadUrl.ts
│   │   ├── getSurgeryScreenshotDownloadUrl.ts
│   │   ├── deleteSurgeryVideo.ts
│   │   ├── deleteSurgeryScreenshot.ts
│   │   ├── renameResource.ts
│   │   ├── getVideoDrafts.ts
│   │   ├── createVideoDraft.ts
│   │   ├── updateVideoDraft.ts
│   │   ├── deleteVideoDraft.ts
│   │   ├── generateVideoFromDraft.ts
│   │   ├── importMonarchDataForSurgery.ts
│   │   ├── importLocalMonarchDataForSurgery.ts
│   │   ├── getMonarchDataProgress.ts
│   │   ├── deleteMonarchDataImport.ts
│   │   ├── prepareExportingVideo.ts
│   │   ├── getPrepareExportingVideoStatus.ts
│   │   ├── cancelPrepareExportingVideo.ts
│   │   ├── exportVideoToUsb.ts
│   │   ├── exportScreenshotToUsb.ts
│   │   ├── putSurgeryDataset.ts
│   │   └── getVTKPath.ts
│   ├── storage/
│   │   ├── index.ts
│   │   ├── getAvailableStorage.ts
│   │   ├── getUsbDevices.ts
│   │   └── getUsbDriveFolderStructures.ts
│   └── mocks/
│       ├── index.ts                    # exports surgeryCenterHandlers
│       ├── surgeries.ts                # Mock surgery data
│       ├── videos.ts                   # Mock video data
│       ├── screenshots.ts              # Mock screenshot data
│       ├── videoDrafts.ts              # Mock video draft data
│       ├── surgery/
│       │   ├── index.ts
│       │   └── [handlers...]
│       └── storage/
│           ├── index.ts
│           └── [handlers...]
```

---

## File Naming Conventions

### API Files

| Type | Naming | Example |
|------|--------|---------|
| Endpoint constants | `endpoints.ts` | `USERS_ENDPOINTS` |
| API function | `{functionName}.ts` | `getUserList.ts` |
| Shared types | `dto.ts` | Request/Response types |
| Barrel export | `index.ts` | Re-exports all |

### Mock Files

| Type | Naming | Example |
|------|--------|---------|
| Mock handler | `{functionName}.ts` | `getUserList.ts` |
| Mock data store | `database.ts` | Shared mock arrays |
| Domain-specific data | `{entityPlural}.ts` | `surgeries.ts` |
| Barrel export | `index.ts` | Handler array export |

### Naming Rules

1. **camelCase** for function names: `getUserById.ts`
2. **PascalCase** for types: `GetUserByIdResponse`
3. **SCREAMING_SNAKE_CASE** for constants: `USERS_ENDPOINTS`
4. **Plural** for data files: `surgeries.ts`, `users.ts`

---

## Import Paths

### From Components

```typescript
// Importing APIs
import { getUserList, createUser } from '@src/app/admin/apis';
import { USERS_ENDPOINTS } from '@src/app/admin/apis/users/endpoints';

// Importing types
import { User } from '@src/app/admin/models/User';
import type { CreateUserRequest } from '@src/app/admin/apis/users/createUser';
```

### From Mock Handlers

```typescript
// Importing axios instance (for baseURL)
import { userTokenRequiredApi } from '@src/infrastructure/net';

// Importing endpoints
import { USERS_ENDPOINTS } from '../../users/endpoints';

// Importing mock data
import { users } from '../database';
```

---

## Barrel Export Examples

### Domain Index (`users/index.ts`)

```typescript
// Endpoints
export { USERS_ENDPOINTS } from './endpoints';

// API functions with types
export { getUserList, type GetUserListResponse } from './getUserList';
export { getUserById } from './getUserById';
export { createUser, type CreateUserRequest, type CreateUserResponse } from './createUser';
export { updateUser, type UpdateUserRequest } from './updateUser';
export { deleteUser } from './deleteUser';
export { changeUserStatus } from './changeUserStatus';
export { resetUserPassword } from './resetUserPassword';
export { getHospital, type Hospital } from './getHospital';
```

### Module Index (`apis/index.ts`)

```typescript
export * from './users';
export * from './departments';
```

### Mock Domain Index (`mocks/users/index.ts`)

```typescript
import { getUserListHandler } from './getUserList';
import { getUserByIdHandler } from './getUserById';
import { createUserHandler } from './createUser';
import { updateUserHandler } from './updateUser';
import { deleteUserHandler } from './deleteUser';
import { changeUserStatusHandler } from './changeUserStatus';
import { resetUserPasswordHandler } from './resetUserPassword';
import { getHospitalHandler } from './getHospital';

export const usersHandlers = [
  getUserListHandler,
  getUserByIdHandler,
  createUserHandler,
  updateUserHandler,
  deleteUserHandler,
  changeUserStatusHandler,
  resetUserPasswordHandler,
  getHospitalHandler
];
```

### Mock Module Index (`mocks/index.ts`)

```typescript
import { usersHandlers } from './users';
import { departmentsHandlers } from './departments';

export const adminHandlers = [
  ...usersHandlers,
  ...departmentsHandlers
];
```

---

## Where to Place New Files

| Need to add... | Location |
|----------------|----------|
| New endpoint to existing domain | `apis/{domain}/endpoints.ts` |
| New API function | `apis/{domain}/{functionName}.ts` |
| New API domain | Create `apis/{newDomain}/` folder |
| New mock handler | `apis/mocks/{domain}/{functionName}.ts` |
| New mock data | `apis/mocks/database.ts` or `apis/mocks/{entities}.ts` |
| Shared types for domain | `apis/{domain}/dto.ts` |
| Model type | `models/{ModelName}.ts` |

---

## Checklist for New API

When adding a new API, ensure:

- [ ] Endpoint added to `endpoints.ts`
- [ ] API function file created with proper types
- [ ] Function exported in domain `index.ts`
- [ ] Mock handler file created (if needed)
- [ ] Mock handler exported in mock domain `index.ts`
- [ ] Mock domain handlers aggregated in mock module `index.ts`
- [ ] Types exported alongside functions
