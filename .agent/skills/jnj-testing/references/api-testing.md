# API Testing Patterns

## Overview

API testing in JnJ Monarch Hub uses **MSW (Mock Service Worker)** for intercepting and mocking HTTP requests in tests.

**Exception:** FormData uploads cannot be mocked with MSW in jsdom environment → use **axios spy** instead.

---

## MSW Setup

### Installation (Already Done)

```bash
npm install -D msw
```

### Basic Pattern

```typescript
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { beforeAll, afterAll, afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { apiFunction } from '@src/path/to/api';
import { ENDPOINTS } from '@src/path/to/endpoints';
import { userTokenRequiredApi } from '@src/infrastructure/net';

const server = setupServer();

describe('apiFunction', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  afterAll(() => server.close());
  afterEach(() => server.resetHandlers());
  beforeEach(() => vi.clearAllMocks());

  it('should fetch data successfully', async () => {
    // arrange
    const mockResponse = { id: 1, name: 'Test' };

    server.use(
      http.get(userTokenRequiredApi.defaults.baseURL + ENDPOINTS.getData, () => {
        return HttpResponse.json(mockResponse);
      }),
    );

    // act
    const result = await apiFunction();

    // assert
    expect(result).toEqual(mockResponse);
  });
});
```

### Lifecycle Hooks Explained

```typescript
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
// Start MSW server once before all tests
// 'bypass' = allow unmocked requests (don't throw errors)

afterAll(() => server.close());
// Stop MSW server after all tests

afterEach(() => server.resetHandlers());
// Reset request handlers after each test
// Prevents handler leakage between tests

beforeEach(() => vi.clearAllMocks());
// Clear mock call history (from vi.fn(), vi.spyOn())
```

---

## HTTP Methods

### GET Request

```typescript
it('should fetch user by ID', async () => {
  // arrange
  const userId = '123';
  const mockUser = { id: userId, name: 'John' };

  server.use(
    http.get(baseURL + ENDPOINTS.getUserById(userId), () => {
      return HttpResponse.json(mockUser);
    }),
  );

  // act
  const result = await getUserById(userId);

  // assert
  expect(result).toEqual(mockUser);
});
```

### POST Request

```typescript
it('should create new user', async () => {
  // arrange
  const payload = { name: 'Jane', email: 'jane@example.com' };
  const mockResponse = { id: '456', ...payload };

  server.use(
    http.post(baseURL + ENDPOINTS.createUser, async ({ request }) => {
      const body = await request.json();
      expect(body).toEqual(payload); // Verify request body
      return HttpResponse.json(mockResponse, { status: 201 });
    }),
  );

  // act
  const result = await createUser(payload);

  // assert
  expect(result).toEqual(mockResponse);
});
```

### PUT Request

```typescript
it('should update user', async () => {
  // arrange
  const userId = '123';
  const payload = { name: 'Updated Name' };
  const mockResponse = { id: userId, ...payload };

  server.use(
    http.put(baseURL + ENDPOINTS.updateUser(userId), () => {
      return HttpResponse.json(mockResponse);
    }),
  );

  // act
  const result = await updateUser(userId, payload);

  // assert
  expect(result).toEqual(mockResponse);
});
```

### DELETE Request

```typescript
it('should delete user', async () => {
  // arrange
  const userId = '123';

  server.use(
    http.delete(baseURL + ENDPOINTS.deleteUser(userId), () => {
      return new HttpResponse(null, { status: 204 });
    }),
  );

  // act
  await deleteUser(userId);

  // assert
  // No exception thrown = success
  expect(true).toBe(true);
});
```

---

## Query Parameters

### Reading Query Parameters

```typescript
it('should pass query parameters', async () => {
  // arrange
  const level = '3';
  const fileIncluded = 'true';

  server.use(
    http.get(baseURL + ENDPOINTS.getUsbFolders, ({ request }) => {
      const url = new URL(request.url);
      const levelParam = url.searchParams.get('level');
      const fileIncludedParam = url.searchParams.get('fileIncluded');

      expect(levelParam).toBe(level);
      expect(fileIncludedParam).toBe(fileIncluded);

      return HttpResponse.json(mockData);
    }),
  );

  // act
  const result = await getUsbDriveFolderStructures(3, true);

  // assert
  expect(result).toBeDefined();
});
```

---

## Request Headers

### Verifying Headers

```typescript
it('should send correct headers', async () => {
  // arrange
  server.use(
    http.get(baseURL + ENDPOINTS.getData, ({ request }) => {
      expect(request.headers.get('Accept')).toBe('application/json;v1');
      expect(request.headers.get('Authorization')).toContain('Bearer');

      return HttpResponse.json(mockData);
    }),
  );

  // act
  await getData();

  // assert
  // Header assertions in handler above
});
```

---

## Error Scenarios

### Network Error

```typescript
it('should handle network error', async () => {
  // arrange
  server.use(
    http.get(baseURL + ENDPOINTS.getData, () => {
      return HttpResponse.error();
    }),
  );

  // act & assert
  await expect(getData()).rejects.toThrow();
});
```

### HTTP Error Status

```typescript
it('should handle 404 error', async () => {
  // arrange
  server.use(
    http.get(baseURL + ENDPOINTS.getUserById('999'), () => {
      return new HttpResponse(null, {
        status: 404,
        statusText: 'Not Found',
      });
    }),
  );

  // act & assert
  await expect(getUserById('999')).rejects.toThrow();
});
```

### Server Error

```typescript
it('should handle 500 error', async () => {
  // arrange
  server.use(
    http.post(baseURL + ENDPOINTS.createUser, () => {
      return new HttpResponse(null, {
        status: 500,
        statusText: 'Internal Server Error',
      });
    }),
  );

  // act & assert
  await expect(createUser({ name: 'Test' })).rejects.toThrow();
});
```

### Validation Error

```typescript
it('should handle validation error', async () => {
  // arrange
  const errorResponse = {
    errors: [{ field: 'email', message: 'Invalid email format' }],
  };

  server.use(
    http.post(baseURL + ENDPOINTS.createUser, () => {
      return HttpResponse.json(errorResponse, { status: 400 });
    }),
  );

  // act & assert
  await expect(createUser({ email: 'invalid' })).rejects.toThrow();
});
```

---

## Delayed Responses

### Simulating Slow Network

```typescript
import { delay } from 'msw';

it('should show loading state during fetch', async () => {
  // arrange
  server.use(
    http.get(baseURL + ENDPOINTS.getData, async () => {
      await delay(1000); // 1 second delay
      return HttpResponse.json(mockData);
    })
  );

  render(<DataComponent />);

  // act
  // (rendering triggers fetch automatically)

  // assert
  expect(screen.getByRole('progressbar')).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});
```

---

## FormData Upload Exception

### Why MSW Doesn't Work

MSW **cannot intercept axios POST requests with FormData** in the jsdom environment due to Node.js limitations.

### Solution: Spy on Axios Directly

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { userTokenRequiredApi } from '@src/infrastructure/net';
import { importMonarchDataForSurgery } from '@src/app/surgeryCenter/apis/surgery/importMonarchDataForSurgery';
import { SURGERY_ENDPOINTS } from '@src/app/surgeryCenter/apis/surgery/endpoints';

describe('importMonarchDataForSurgery', () => {
  let postSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Spy on axios post method
    postSpy = vi.spyOn(userTokenRequiredApi, 'post' as any).mockResolvedValue({
      data: mockResponse,
    });
  });

  it('should upload files as multipart FormData', async () => {
    // arrange
    const mockFile1 = new File(['vtk data 1'], 'model-1.vtk', {
      type: 'application/octet-stream',
    });
    const mockFile2 = new File(['vtk data 2'], 'model-2.vtk', {
      type: 'application/octet-stream',
    });

    const payload = {
      folderName: 'test-monarch-data',
      files: [mockFile1, mockFile2],
    };

    // act
    const result = await importMonarchDataForSurgery('surgery-1', payload);

    // assert
    expect(result.id).toBe('import-1');
    expect(result.fileCount).toBe(2);

    // Verify FormData was constructed correctly
    const calledFormData = postSpy.mock.calls[0][1] as FormData;
    expect(calledFormData).toBeInstanceOf(FormData);
    expect(calledFormData.get('folderName')).toBe('test-monarch-data');
    expect(calledFormData.getAll('files')).toHaveLength(2);
  });

  it('should call correct endpoint with surgery id', async () => {
    // arrange
    const mockFile = new File(['data'], 'file.vtk');
    const payload = {
      folderName: 'test',
      files: [mockFile],
    };

    // act
    await importMonarchDataForSurgery('test-surgery-123', payload);

    // assert
    const calledEndpoint = postSpy.mock.calls[0][0] as string;
    expect(calledEndpoint).toBe(SURGERY_ENDPOINTS.importMonarchDataForSurgery('test-surgery-123'));
    expect(calledEndpoint).toContain('test-surgery-123');
    expect(calledEndpoint).toContain('monarch-data-imports');
  });

  it('should pass AbortSignal in request config', async () => {
    // arrange
    const mockFile = new File(['vtk data'], 'model.vtk');
    const controller = new AbortController();
    const payload = {
      folderName: 'test-data',
      files: [mockFile],
    };

    // act
    await importMonarchDataForSurgery('surgery-1', payload, controller.signal);

    // assert
    const calledConfig = postSpy.mock.calls[0][2] as Record<string, unknown>;
    expect(calledConfig.signal).toBe(controller.signal);
  });

  it('should pass onUploadProgress in request config', async () => {
    // arrange
    const mockFile = new File(['vtk data'], 'model.vtk');
    const progressCallback = vi.fn();
    const payload = {
      folderName: 'test-data',
      files: [mockFile],
    };

    // act
    await importMonarchDataForSurgery('surgery-1', payload, undefined, progressCallback);

    // assert
    const calledConfig = postSpy.mock.calls[0][2] as Record<string, unknown>;
    expect(calledConfig.onUploadProgress).toBe(progressCallback);
  });

  it('should set correct headers for FormData request', async () => {
    // arrange
    const mockFile = new File(['vtk data'], 'model.vtk');
    const payload = {
      folderName: 'test-data',
      files: [mockFile],
    };

    // act
    await importMonarchDataForSurgery('surgery-1', payload);

    // assert
    const calledConfig = postSpy.mock.calls[0][2] as Record<string, unknown>;
    const headers = calledConfig.headers as Record<string, string>;
    expect(headers['Accept']).toBe('application/json;v1');
    expect(headers['Content-Type']).toBe('multipart/form-data');
  });

  it('should handle API error', async () => {
    // arrange
    postSpy.mockRejectedValueOnce(new Error('Request failed with status code 500'));

    const mockFile = new File(['vtk data'], 'model.vtk');
    const payload = {
      folderName: 'test-data',
      files: [mockFile],
    };

    // act & assert
    await expect(importMonarchDataForSurgery('surgery-1', payload)).rejects.toThrow();
  });
});
```

### Key Points for FormData Testing

1. **Spy on axios instance**, not use MSW
2. **Verify FormData construction** via `postSpy.mock.calls[0][1]`
3. **Check endpoint, headers, config** via spy call arguments
4. **Test upload progress callback** if supported

---

## Testing Retry Logic

```typescript
it('should retry failed request', async () => {
  // arrange
  let attemptCount = 0;

  server.use(
    http.get(baseURL + ENDPOINTS.getData, () => {
      attemptCount++;

      if (attemptCount < 3) {
        return new HttpResponse(null, { status: 500 });
      }

      return HttpResponse.json(mockData);
    }),
  );

  // act
  const result = await getDataWithRetry();

  // assert
  expect(attemptCount).toBe(3);
  expect(result).toEqual(mockData);
});
```

---

## Testing AbortController

```typescript
it('should cancel request when aborted', async () => {
  // arrange
  const controller = new AbortController();

  server.use(
    http.get(baseURL + ENDPOINTS.getData, async () => {
      await delay(1000);
      return HttpResponse.json(mockData);
    }),
  );

  // act
  const promise = getData(controller.signal);
  controller.abort();

  // assert
  await expect(promise).rejects.toThrow('canceled');
});
```

---

## Common Patterns

### Reusable Mock Data

```typescript
// tests/__mocks__/usbStorage.ts
export const mockUsbDriveFolderStructures = [
  {
    drive: '/mnt/usb0',
    description: 'USB Drive',
    folderStructure: {
      name: 'usb0',
      path: '/mnt/usb0',
      children: [
        {
          name: 'reports',
          path: '/mnt/usb0/reports',
          children: [],
          files: [{ name: 'report1.pdf', path: '/mnt/usb0/reports/report1.pdf' }],
        },
      ],
      files: [],
    },
  },
];

// In tests
import { mockUsbDriveFolderStructures } from '@tests/__mocks__/usbStorage';

server.use(
  http.get(baseURL + ENDPOINTS.getUsbFolders, () => {
    return HttpResponse.json(mockUsbDriveFolderStructures);
  }),
);
```

### Dynamic Mock Response

```typescript
server.use(
  http.get(baseURL + ENDPOINTS.getUsers, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedUsers = allMockUsers.slice(start, end);

    return HttpResponse.json({
      data: paginatedUsers,
      total: allMockUsers.length,
      page,
      limit,
    });
  }),
);
```

---

## Best Practices

### ✅ DO

- Use MSW for all API tests (except FormData)
- Reset handlers after each test (`afterEach`)
- Verify request parameters in handler
- Test both success and error scenarios
- Use meaningful mock data
- Keep mock data in separate files for reuse

### ❌ DON'T

- Don't use MSW for FormData uploads (use spy)
- Don't forget to close server (`afterAll`)
- Don't test implementation details of axios
- Don't mock response structure differently from real API
- Don't share server instance between test files

---

## Summary

- **MSW** for HTTP request mocking (GET, POST, PUT, DELETE)
- **Axios spy** for FormData uploads
- **server.resetHandlers()** after each test
- **Test query params, headers, request body**
- **Test error scenarios** (network, 4xx, 5xx)
- **Use delay()** to test loading states
- **Reuse mock data** across tests
