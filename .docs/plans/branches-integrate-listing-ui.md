# Integrate Branch Listing UI

## Context

The public storefront currently uses hardcoded branch options in `frontend/app/(public)/page.tsx`. The backend already exposes `GET /branches`, returning active, non-deleted branches from `RestaurantService.findBranches()`.

## Plan

- Add a frontend `Branch` model type for the backend branch payload.
- Add a `branchesService` API service that calls the public `/branches` endpoint.
- Fetch branches in the public storefront page as a server component.
- Move the interactive branch selector state into a small client component.
- Render only branches returned by the backend; do not use static fallback branches when the API fails or returns empty.
- Run targeted linting on changed frontend files.
