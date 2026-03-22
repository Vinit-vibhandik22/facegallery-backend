# Conventions Reference

## Coding Style
- **Components**: Functional components only. Use `export function ComponentName()`.
- **Hooks**: Standard React hooks (`useState`, `useEffect`) and custom hooks for state management.
- **Naming**:
  - `camelCase` for props, functions, and variables.
  - `PascalCase` for components.
  - `SCREAMING_SNAKE_CASE` for constants.
- **Interfaces**: Prefixed with `I` (e.g. `IFace`) is not used. Standard `Face`, `Photo`, `Cluster` interfaces in `src/lib/types.ts`.

## TypeScript Patterns
- **Type Safety**: Strict typing in `src/lib/types.ts`.
- **Enums**: Used via `types.ts` for cluster statuses and project states.
- **Async**: `async/await` pattern preferred for database and API calls.

## Styling (Tailwind CSS 4.2.1)
- **CSS Variables**: Theme constants in `src/app/globals.css`.
- **Glassmorphism**: Heavy use of backdrop-blur and semi-transparent backgrounds.
- **Animations**: Framer Motion for entrance animations, GSAP for scrolling and complex transitions.
- **Transitions**: Smooth easing (`cubic-bezier`).

## Shared Utilities (`src/lib/utils.ts`)
- **Formatting**: `formatDate`, `formatDateTime`, `timeAgo`.
- **Text**: `truncate`.
- **Status UI**: `getConfidenceColor`, `getConfidenceLabel`, `getStatusColor`.
