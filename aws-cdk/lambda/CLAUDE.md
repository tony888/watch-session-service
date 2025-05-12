# Watch Session Service Lambda

## Build & Test Commands
- Build: `npm run build`
- Lint: `npm run lint`
- Type check: `npm run typecheck`
- Test all: `npm test`
- Test single file: `npm test -- -t "test name"` or `npm test -- path/to/test.ts`

## Code Style Guidelines
- **Naming**: camelCase for variables/functions, PascalCase for types/interfaces/classes
- **Typing**: Use TypeScript types; prefer Zod for runtime validation
- **Error handling**: Use `catchError` utility for async operations
- **Logging**: Use the logger utility with appropriate log levels and context
- **Imports**: Group by source (internal/external), alphabetize within groups
- **Code structure**: Separate concerns into services, utils, and types
- **Documentation**: JSDoc for public functions and complex logic
- **Formatting**: Use 2 spaces for indentation
- **Function pattern**: Async/await with proper error handling
- **Error propagation**: Log errors with context before re-throwing or handling