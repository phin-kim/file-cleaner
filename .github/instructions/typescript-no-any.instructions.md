---
name: typescript-no-any
description: Never use 'any' type in TypeScript code. Always provide proper types or use unknown if necessary.
applyTo: "**/*.ts", "**/*.tsx"
---

# TypeScript No 'any' Rule

When writing or editing TypeScript code, strictly avoid using the `any` type. Instead:

- Use explicit type annotations for variables, parameters, and return types.
- Define interfaces or types for objects.
- Use `unknown` for values of truly unknown type, and narrow them with type guards.
- Prefer union types, generics, or utility types over `any`.

This ensures type safety, reduces bugs, and improves code maintainability.

Examples:

- Instead of `let data: any;`, use `let data: unknown;` and type-guard it.
- Instead of `function foo(param: any)`, define `function foo(param: string | number)`.
