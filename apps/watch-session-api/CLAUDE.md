# CLAUDE.md - Watch Session Service API Guidelines

## Build and Development Commands
- Start application: `bun start`
- Development with hot reload: `bun dev`
- Run single test: `bun test test/session.test.ts` (or replace with specific test file)

## Code Style Guidelines

### Imports & Structure
- Import from node packages first, then local modules
- Group imports by source (node modules, local modules)
- Use absolute imports from src root

### Typescript
- Use strict mode and explicit types
- Prefer type over interface for consistency
- Use Zod for validation with @hono/zod-validator

### Error Handling
- Use custom exception classes (NotFoundException, BadRequestException, etc.)
- Use catchError/catchErrorTyped utilities for async operations
- Return standardized error responses with createErrorResponse utility

### Naming Conventions
- Use camelCase for variables, functions
- PascalCase for classes, types, interfaces
- Use descriptive names for functions and variables

### API Patterns
- Routes use Hono framework with consistent error handling
- Return standardized responses with createSuccessResponse/createErrorResponse
- Follow RESTful conventions for endpoints