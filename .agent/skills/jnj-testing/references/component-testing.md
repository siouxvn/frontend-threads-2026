# Component Testing Patterns

## Testing Philosophy for Components

**Test user behavior, not implementation details.**

### ✅ DO Test

- What the user sees (rendered content)
- How the user interacts (clicks, types, selects)
- Accessibility (roles, labels, aria attributes)
- Conditional rendering based on props/state
- Form submission and validation

### ❌ DON'T Test

- Internal state variables (`useState` values)
- Component hierarchy (parent/child structure)
- CSS class names or styling
- Framework internals (React, Antd)
- Props passed to child components (unless user-visible)

---

## Basic Component Rendering

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MyComponent } from '@src/path/to/MyComponent';

describe('MyComponent', () => {
  it('should render the component', () => {
    // arrange
    // (no setup needed)

    // act
    render(<MyComponent />);

    // assert
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });
});
```

---

## Querying Elements

### Query Methods

```typescript
// getBy* - Throws error if not found (use for existing elements)
screen.getByRole('button', { name: /submit/i });
screen.getByText('Hello');
screen.getByLabelText('Email');
screen.getByPlaceholderText('Enter email');
screen.getByTestId('submit-button');

// queryBy* - Returns null if not found (use for conditional elements)
screen.queryByText('Optional Message'); // null if not present

// findBy* - Async, waits for element (use for delayed appearance)
await screen.findByText('Success Message');
```

### Query Priority (Recommended Order)

1. **getByRole** (best - accessible, semantic)

   ```typescript
   screen.getByRole('button', { name: /submit/i });
   screen.getByRole('textbox', { name: /email/i });
   screen.getByRole('heading', { level: 1 });
   ```

2. **getByLabelText** (forms)

   ```typescript
   screen.getByLabelText('Email');
   screen.getByLabelText(/password/i);
   ```

3. **getByPlaceholderText** (inputs)

   ```typescript
   screen.getByPlaceholderText('Enter your name');
   ```

4. **getByText** (non-interactive content)

   ```typescript
   screen.getByText('Welcome');
   screen.getByText(/hello world/i); // Case-insensitive regex
   ```

5. **getByTestId** (last resort)
   ```typescript
   screen.getByTestId('custom-widget');
   ```

---

## User Interactions

### Clicking

```typescript
import userEvent from '@testing-library/user-event';

it('should call onClick when button is clicked', async () => {
  // arrange
  const handleClick = vi.fn();
  render(<Button onClick={handleClick}>Click Me</Button>);
  const button = screen.getByRole('button', { name: /click me/i });

  // act
  await userEvent.click(button);

  // assert
  expect(handleClick).toHaveBeenCalledOnce();
});
```

### Typing

```typescript
it('should update input value when user types', async () => {
  // arrange
  const handleChange = vi.fn();
  render(<Input onChange={handleChange} />);
  const input = screen.getByRole('textbox');

  // act
  await userEvent.type(input, 'Hello');

  // assert
  expect(input).toHaveValue('Hello');
  expect(handleChange).toHaveBeenCalledTimes(5);  // Once per character
});
```

### Selecting Options

```typescript
it('should select option from dropdown', async () => {
  // arrange
  render(<Select options={['Option 1', 'Option 2']} />);
  const select = screen.getByRole('combobox');

  // act
  await userEvent.selectOptions(select, 'Option 2');

  // assert
  expect(select).toHaveValue('Option 2');
});
```

### Clearing Input

```typescript
it('should clear input value', async () => {
  // arrange
  render(<Input defaultValue="Initial" />);
  const input = screen.getByRole('textbox');

  // act
  await userEvent.clear(input);

  // assert
  expect(input).toHaveValue('');
});
```

---

## Testing Conditional Rendering

### Based on Props

```typescript
it('should show error message when error prop is provided', () => {
  // arrange
  const errorMessage = 'Invalid email';

  // act
  render(<FormInput error={errorMessage} />);

  // assert
  expect(screen.getByText(errorMessage)).toBeInTheDocument();
});

it('should not show error message when error prop is null', () => {
  // arrange
  // (no error prop)

  // act
  render(<FormInput />);

  // assert
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
```

### Based on State

```typescript
it('should show loading spinner while loading', () => {
  // arrange
  render(<DataComponent isLoading={true} />);

  // act
  // (no action needed, testing initial render)

  // assert
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
});

it('should show data when loading is complete', () => {
  // arrange
  const mockData = { name: 'Test User' };
  render(<DataComponent isLoading={false} data={mockData} />);

  // act
  // (no action needed)

  // assert
  expect(screen.getByText('Test User')).toBeInTheDocument();
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
});
```

---

## Testing Forms

### Form Submission

```typescript
it('should submit form with user input', async () => {
  // arrange
  const handleSubmit = vi.fn();
  render(<LoginForm onSubmit={handleSubmit} />);

  const emailInput = screen.getByLabelText(/email/i);
  const passwordInput = screen.getByLabelText(/password/i);
  const submitButton = screen.getByRole('button', { name: /submit/i });

  // act
  await userEvent.type(emailInput, 'user@example.com');
  await userEvent.type(passwordInput, 'password123');
  await userEvent.click(submitButton);

  // assert
  expect(handleSubmit).toHaveBeenCalledWith({
    email: 'user@example.com',
    password: 'password123',
  });
});
```

### Form Validation

```typescript
it('should show validation error for invalid email', async () => {
  // arrange
  render(<RegistrationForm />);
  const emailInput = screen.getByLabelText(/email/i);
  const submitButton = screen.getByRole('button', { name: /submit/i });

  // act
  await userEvent.type(emailInput, 'invalid-email');
  await userEvent.click(submitButton);

  // assert
  expect(await screen.findByText(/invalid email format/i)).toBeInTheDocument();
});

it('should disable submit button when form is invalid', () => {
  // arrange
  render(<RegistrationForm />);
  const submitButton = screen.getByRole('button', { name: /submit/i });

  // act
  // (empty form is invalid)

  // assert
  expect(submitButton).toBeDisabled();
});
```

---

## Testing with React Query

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },  // Disable retry in tests
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

it('should display data after successful fetch', async () => {
  // arrange
  server.use(
    http.get(baseURL + ENDPOINTS.getUsers, () => {
      return HttpResponse.json([{ id: 1, name: 'John' }]);
    })
  );

  // act
  render(<UserList />, { wrapper: createWrapper() });

  // assert
  await waitFor(() => {
    expect(screen.getByText('John')).toBeInTheDocument();
  });
});
```

---

## Testing Async Behavior

### Using waitFor

```typescript
it('should show success message after API call', async () => {
  // arrange
  server.use(
    http.post(baseURL + ENDPOINTS.createUser, async () => {
      await delay(500);
      return HttpResponse.json({ id: 1 }, { status: 201 });
    })
  );

  render(<CreateUserForm />);
  const submitButton = screen.getByRole('button', { name: /submit/i });

  // act
  await userEvent.click(submitButton);

  // assert
  await waitFor(() => {
    expect(screen.getByText(/user created successfully/i)).toBeInTheDocument();
  });
});
```

### Using findBy (Preferred for Async)

```typescript
it('should display error message on API failure', async () => {
  // arrange
  server.use(
    http.post(baseURL + ENDPOINTS.createUser, () => {
      return new HttpResponse(null, { status: 500 });
    })
  );

  render(<CreateUserForm />);

  // act
  await userEvent.click(screen.getByRole('button', { name: /submit/i }));

  // assert
  expect(await screen.findByText(/failed to create user/i)).toBeInTheDocument();
});
```

---

## Testing Modals

```typescript
it('should open modal when button is clicked', async () => {
  // arrange
  render(<ComponentWithModal />);
  const openButton = screen.getByRole('button', { name: /open modal/i });

  // act
  await userEvent.click(openButton);

  // assert
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByText(/modal content/i)).toBeInTheDocument();
});

it('should close modal when cancel button is clicked', async () => {
  // arrange
  render(<ComponentWithModal />);

  await userEvent.click(screen.getByRole('button', { name: /open modal/i }));
  const modal = screen.getByRole('dialog');
  const cancelButton = screen.getByRole('button', { name: /cancel/i });

  // act
  await userEvent.click(cancelButton);

  // assert
  expect(modal).not.toBeInTheDocument();
});
```

---

## Accessibility Testing

```typescript
it('should have accessible button', () => {
  // arrange
  // (no setup needed)

  // act
  render(<SubmitButton />);

  // assert
  const button = screen.getByRole('button', { name: /submit/i });
  expect(button).toHaveAccessibleName('Submit');
});

it('should have proper form labels', () => {
  // arrange
  // (no setup needed)

  // act
  render(<LoginForm />);

  // assert
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
});
```

---

## Common Patterns

### Reusable Render Function

```typescript
const renderWithProviders = (ui: React.ReactElement, options = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    ),
    ...options,
  });
};

it('should render with providers', () => {
  renderWithProviders(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

---

## Best Practices

### ✅ DO

- Use `getByRole` as primary query method
- Test user-visible behavior
- Use `waitFor` for async updates
- Use `it.each` for components with multiple rendering states (loading, error, empty)
- Mock API calls with MSW
- Keep tests focused on one behavior
- Use `screen` instead of destructuring

### ❌ DON'T

- Access internal state (`wrapper.find(...)`)
- Test CSS classes or styling
- Query by implementation details
- Use `container.querySelector`
- Test props passed to children
- Use snapshots for behavioral tests

---

## Mocking Complex UI Components (e.g., Ant Design)

In projects using Ant Design (especially version 5+ with ESM), component styles or internal submodules (like `theme/internal`) may cause resolution errors in JSDOM/Vitest. In such cases, **targeted mocking** of UI components is recommended.

### 1. Mocking Philosophy for UI Libraries

- **Simulate Semantic Output**: Replace complex components with simple HTML elements that have the same accessibility roles (`role="dialog"`, `role="combobox"`, etc.).
- **Mirror the Prop API**: Ensure your mock accepts and correctly uses key props like `open`, `onOk`, `onChange`, and `loading`.
- **Maintain Accessibility**: By using proper roles, you can still use `getByRole` and other semantic queries in your tests.

### 2. Implementation Example (Modal & TreeSelect)

```typescript
vi.mock('@src/ui/components', async () => {
  const { Form } = await import('antd'); // Import real logic if needed
  
  return {
    Modal: ({ children, title, open, onOk, onCancel, okText, cancelText, okButtonProps }: ModalProps & { children?: ReactNode }) => {
      // ✅ Respect visibility state
      if (!open) return null;
      
      return (
        <div role="dialog" aria-label={typeof title === 'string' ? title : undefined}>
          <h1>{title}</h1>
          {children}
          <button type="button" onClick={onCancel as any}>{cancelText || 'Cancel'}</button>
          <button type="button" onClick={onOk as any} disabled={okButtonProps?.disabled}>{okText || 'OK'}</button>
        </div>
      );
    },
    TreeSelect: ({ treeData, value, onChange, placeholder }: TreeSelectProps) => (
      <div role="combobox" aria-label={typeof placeholder === 'string' ? placeholder : 'select'}>
        <input readOnly value={(value as string) || ''} />
        {treeData?.map(item => (
          <div key={item.value as string} onClick={() => onChange?.(item.value, [item.label], {})}>
            {item.label}
          </div>
        ))}
      </div>
    ),
    // ✅ Bridge to real Antd if only styles are an issue for specific sub-components
    FormItem: (props: FormItemProps) => <Form.Item {...props} />,
  };
});
```

### 3. Key Benefits

- **Speed**: Tests run significantly faster by avoiding complex component rendering.
- **Stability**: Prevents "module not found" or CSS-related crashes in the testing environment.
- **Focus**: Keeps the test focused on YOUR component's logic rather than the UI library's internals.

---

## Summary

- **Use @testing-library/react** `render` and `screen`
- **Query by role** whenever possible (accessibility-first)
- **userEvent** for realistic user interactions
- **waitFor** or **findBy** for async rendering
- **Test behavior**, not implementation
- **Use wrappers** for providers (React Query, Context)
