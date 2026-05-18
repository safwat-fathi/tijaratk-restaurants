# Fix Prisma Exception Filter Imports

## Problem

The backend fails TypeScript compilation because `@prisma/client` does not export `Prisma` in this project.

## Cause

The Prisma schema generates the client to `src/generated/prisma`, so the generated `Prisma` namespace is exported from `src/generated/prisma/client.ts`, not from `@prisma/client`.

## Plan

1. Update `src/common/filters/all-exception.filter.ts` to import `Prisma` from `../../generated/prisma/client`.
2. Update `src/common/filters/db-exception.filter.ts` to import `Prisma` from `../../generated/prisma/client`.
3. Run a targeted build check from the backend package.
