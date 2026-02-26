```
# React 19 Patterns

## Quick Reference

| Pattern         | Use                              | Avoid                               |
| --------------- | -------------------------------- | ----------------------------------- |
| Components      | Function + default params        | Class, `defaultProps`, `prop-types` |
| Refs            | `ref` as prop                    | `forwardRef`                        |
| Context         | `<Context value={...}>`          | `<Context.Provider>`                |
| Metadata        | `<title>` in component           | `<Head>` component                  |
| Forms           | `<form action={serverFn}>`       | `onSubmit` handler                  |
| Pending state   | `useFormStatus()`                | Custom loading state                |
| Form state      | `useActionState()`               | Custom error state                  |
| Optimistic UI   | `useOptimistic()`                | Manual state                        |
| Data fetching   | `use()` + Suspense               | `useEffect` + loading state         |
| Performance     | React Compiler (auto)            | `useMemo`, `useCallback`            |
| Deferred values | `useDeferredValue(val, initial)` | Custom debouncing                   |

## Component Patterns

### Function Components

```tsx
// Default parameters instead of defaultProps
function Button({ variant = "primary", children }: ButtonProps) {
  return <button className={variant}>{children}</button>;
}
```

### Refs as Props (no forwardRef)

```tsx
function Input({
  ref,
  ...props
}: InputProps & { ref?: Ref<HTMLInputElement> }) {
  return <input ref={ref} {...props} />;
}
```

### Context (no Provider wrapper)

```tsx
<ThemeContext value={theme}>
  <App />
</ThemeContext>
```

### Ref Callbacks with Cleanup

```tsx
<div
  ref={(node) => {
    if (!node) return;
    const observer = new ResizeObserver(() => {
      /* handle resize */
    });
    observer.observe(node);
    return () => observer.disconnect(); // Cleanup function
  }}
/>
```

## Data Fetching

### use() Hook

Read Promises and Context with Suspense. No `useEffect` needed. Can be called in conditionals/loops (unlike other hooks).

```tsx
import { use, Suspense } from "react";

function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise); // Suspends until resolved
  return <div>{user.name}</div>;
}

// Parent creates promise, wraps in Suspense
<Suspense fallback={<Loading />}>
  <UserProfile userPromise={fetchUser(id)} />
</Suspense>;
```

**Rules:**

- Promise must come from props/context (not created in render)
- Errors bubble to nearest ErrorBoundary
- Works with Context too: `const theme = use(ThemeContext)`

## Forms and Actions

### Server Functions

```tsx
"use server";

async function createItem(formData: FormData) {
  const name = formData.get("name") as string;
  await repo.create({ name });
  revalidatePath("/items");
}
```

```tsx
// Usage - progressive enhancement, works without JS
<form action={createItem}>
  <input name="name" required />
  <SubmitButton />
</form>
```

### useFormStatus

Access parent form state. **Must be in a child component of the form.**

```tsx
"use client";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save"}
    </button>
  );
}
```

### useActionState

Handle form state and validation errors.

```tsx
"use client";
import { useActionState } from "react";

function CreateForm() {
  const [state, formAction] = useActionState(createItem, {
    message: "",
    errors: {},
  });

  return (
    <form action={formAction}>
      <input name="name" required />
      {state.errors.name && <p className="error">{state.errors.name}</p>}
      <SubmitButton />
    </form>
  );
}
```

```tsx
// Server Function with validation
"use server";

async function createItem(prevState: State, formData: FormData) {
  const name = formData.get("name") as string;
  if (!name || name.length < 3) {
    return {
      message: "",
      errors: { name: "Name must be at least 3 characters" },
    };
  }
  await repo.create({ name });
  return { message: "Created!", errors: {} };
}
```

### useOptimistic

Instant UI feedback while async action runs.

```tsx
"use client";
import { useOptimistic } from "react";

function TodoList({ todos }: { todos: Todo[] }) {
  const [optimisticTodos, addOptimistic] = useOptimistic(
    todos,
    (state, newTodo: Todo) => [...state, newTodo],
  );

  async function addTodo(formData: FormData) {
    const tempTodo = {
      id: crypto.randomUUID(),
      title: formData.get("title") as string,
      completed: false,
    };
    addOptimistic(tempTodo);
    await createTodo(tempTodo.title);
  }

  return (
    <>
      <ul>
        {optimisticTodos.map((todo) => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
      <form action={addTodo}>
        <input name="title" required />
        <button>Add</button>
      </form>
    </>
  );
}
```

## Performance

### React Compiler

Compiler auto-memoizes. **Do not add manual memoization** (`useMemo`, `useCallback`, `memo`) unless:

- Justified with benchmark
- Compiler unavailable
- Extremely expensive operation

```tsx
// Let compiler optimize - no manual memoization needed
function ExpensiveComponent({ data }: { data: Data[] }) {
  const processed = data.map((item) => transform(item));
  return (
    <div>
      {processed.map((item) => (
        <Item key={item.id} item={item} />
      ))}
    </div>
  );
}
```

### useDeferredValue

Defer expensive re-renders. New `initialValue` option in React 19.

```tsx
"use client";
import { useDeferredValue, useState } from "react";

function SearchResults() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query, ""); // initialValue for first render

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <ExpensiveList query={deferredQuery} />
    </>
  );
}
```

## Effects

**Prefer event handlers over useEffect.** Use `useEffect` only for:

- Synchronizing with external systems (WebSocket, DOM APIs)
- Managing cleanup (event listeners, timers)

```tsx
// Event handler for side effects (preferred)
function Component() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(count + 1);
    logEvent("button_clicked", { count: count + 1 });
  }

  return <button onClick={handleClick}>Count: {count}</button>;
}
```

## Document Metadata

React hoists `<title>`, `<meta>`, `<link>` to `<head>` automatically.

```tsx
function ProductPage({ product }: { product: Product }) {
  return (
    <>
      <title>{product.name} | My Store</title>
      <meta name="description" content={product.description} />
      <div>{/* Page content */}</div>
    </>
  );
}
```

## Stylesheets and Scripts

```tsx
// React deduplicates and orders stylesheets by precedence
<link rel="stylesheet" href="/styles/component.css" precedence="default" />

// Async scripts are SSR-safe
<script async src="https://analytics.example.com/script.js" />
```

## React 19.2 (October 2025)

New/experimental features:

- **Activity**: Pre-render hidden UI (`visible`/`hidden` modes) without impacting visible performance
- **useEffectEvent**: Extract event logic from effects without stale closure issues
- **ViewTransition**: Suspense animations during SSR
- **Partial Pre-rendering**: Pre-render static parts, resume for dynamic content

## TypeScript Notes

### Accessing Refs from Elements

```tsx
// Use element.props.ref (not element.ref)
function getChildRef(element: ReactElement) {
  return element.props.ref;
}
```

### Testing

Use Testing Library + `React.act`. Avoid `react-dom/test-utils` and shallow renderer (removed).

```tsx
import { render, screen } from "@testing-library/react";

test("renders component", () => {
  render(<Component />);
  expect(screen.getByText("Hello")).toBeInTheDocument();
});
```

```

```
