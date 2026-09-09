# Testing & code quality rules

## Commands

| Command                 | What it does                                              |
| ----------------------- | --------------------------------------------------------- |
| `bun run test`          | Run the whole unit test suite once                          |
| `bun run test:watch`    | Re-run tests as you edit                                    |
| `bun run test:coverage` | Run tests and enforce the coverage thresholds               |
| `bun run lint`          | ESLint (TypeScript, React hooks, accessibility, Prettier)   |
| `bun run lint:fix`      | Auto-fix everything ESLint and Prettier can fix             |
| `bun run verify`        | Lint + tests + coverage — run this before shipping a change |

## Stack

- **Vitest** with the `jsdom` environment (`vitest.config.ts`).
- **Testing Library** (`@testing-library/react`, `user-event`, `jest-dom`) for component tests.
- Global setup lives in `src/test/setup.ts`; it registers the jest-dom matchers,
  cleans the DOM after every test and mocks `@/integrations/supabase/client`
  so no test ever reaches the real backend.

## Rules

1. **Tests live next to the code** they cover: `Composer.tsx` → `Composer.test.tsx`.
2. **Test behaviour, not implementation.** Query the DOM the way a user or a
   screen reader would — `getByRole`, `getByLabelText` — never by CSS class or
   test id unless there is no accessible alternative.
3. **Every bug fix gets a regression test** that fails before the fix.
4. **New non-trivial logic ships with tests**: pure helpers in `src/lib`,
   custom hooks in `src/hooks`, and any component with branching UI states.
5. **No real network calls.** The backend client is mocked globally; mock
   `@/lib/chat` in tests that need specific data.
6. **Accessible names are part of the contract.** If a test can't find a control
   by its role and name, that is an accessibility bug, not a test problem.
7. **Coverage thresholds only go up, never down.** See below.

## Coverage thresholds

Configured in `vitest.config.ts` and enforced by `bun run test:coverage`.

- **Global floor** (statements/lines 22%, branches 22%, functions 18%) covers all
  of `src` except generated files, shadcn primitives in `src/components/ui`,
  the backend integration folder and route files.
- **Per-file floors** are much stricter for modules that already have real tests:
  `src/lib/utils.ts` (100%), `src/hooks/useTyping.ts` (~90%),
  `Composer.tsx`, `MessageRow.tsx`, `TypingIndicator.tsx`, `UserAvatar.tsx`.

When you add tests that lift a file's coverage, raise its floor in the same pull
request. Lowering a threshold to make a build pass is not allowed — write the
test instead.

## Lint rules worth knowing

`eslint.config.js` layers:

- `@eslint/js` + `typescript-eslint` recommended
- `eslint-plugin-react-hooks` — rules of hooks and dependency checks
- `eslint-plugin-jsx-a11y` recommended — icon-only buttons without a label,
  click handlers on non-interactive elements, missing alt text, etc.
- `no-console` (warn, `console.warn`/`console.error` allowed), `eqeqeq`, `prefer-const`
- Prettier runs as a lint rule, so formatting problems fail `bun run lint`

Generated code is exempted rather than edited: `src/routeTree.gen.ts`,
`src/integrations/**` and the shadcn primitives in `src/components/ui`.
