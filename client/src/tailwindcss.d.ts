/**
 * Author: Cascade (using gpt-4o)
 * Date: 2025-09-22T12:41:26-04:00
 * PURPOSE: This file provides a module declaration for the `@tailwindcss/vite` package. This is necessary because the package does not currently ship with its own TypeScript type definitions. By declaring the module, we inform the TypeScript compiler that the module exists, which resolves "Cannot find module" errors and allows the project to be type-checked successfully. This file is automatically included by the TypeScript compiler based on the `include` settings in `tsconfig.json`.
 * SRP and DRY check: Pass. This is a new, single-purpose file that provides a necessary type declaration not present elsewhere in the project.
 */

declare module '@tailwindcss/vite';
