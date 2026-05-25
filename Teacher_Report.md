# Trading-App — Project Report

Student: [Your Name]

Course: [Course Name]

Date: May 25, 2026

## Abstract
This document summarizes the Trading-App project: objectives, architecture, implementation details, testing and evaluation, and suggested improvements. The project is an Angular-based single-page application that demonstrates frontend design and integration with backend services for market data and persistence.

## Objectives
- Implement a modular Angular frontend for a trading dashboard
- Integrate market-data (Finnhub or equivalent) and persist user data with Supabase
- Demonstrate service layering, guarded routes, and component-based UI
- Provide testable services and unit tests for core logic

## Approach & Methodology
- The app adopts a feature-driven structure (separate folders per feature).
- Core services live in `src/app/core/services` and provide reusable logic for auth, market data, portfolio, notifications and persistence.
- Supabase is used as a hosted Postgres + auth backend; the `supabase` folder includes `schema.sql` and `seed.sql` to initialize tables and sample data.

## Architecture
- Presentation: Angular components in `src/app/features/*`
- Business logic: Angular services in `src/app/core/services`
- Persistence: Supabase (Postgres)
- External APIs: Finnhub (market-data provider) — pluggable via `market-data.service.ts`

## Key Implementation Details
- Authentication: `auth.service.ts` and `auth.guard.ts` restrict routes and provide a basic auth flow.
- Market Data: `market-data.service.ts` abstracts API calls to the market-data provider.
- Portfolio: `portfolio.service.ts` implements portfolio reads/updates; intended to persist via Supabase.
- Notifications & Alerts: `notifications.service.ts`, `alerts.service.ts` provide UI messaging and real-time notifications scaffolding.

## Setup & How to Run
1. Install dependencies: `npm install`
2. Set environment variables for API keys (Finnhub + Supabase)
3. Start the dev server: `npm start`
4. Load or apply `supabase/schema.sql` to your Postgres instance if you plan to use Supabase locally.

## Testing & Evaluation
- Unit tests are included as `.spec.ts` files next to several services. Run `npm test` to execute tests.
- Manual verification: launch the app and check dashboard, watchlist and portfolio views; verify API responses if keys are configured.

## Limitations
- The UI contains placeholder and scaffold components that need completion for production use.
- Error handling, input validation, and security hardening require additional work before any real-money usage.

## Future Work
- Complete trade order flows and server-side order processing.
- Add end-to-end tests and CI integration.
- Add role-based access and stronger authentication flows.

## Conclusion
This project provides a modular Angular frontend demonstrating integration with external APIs and a hosted persistence layer. It is appropriate as a coursework submission illustrating architecture, service decomposition, and practical integration tests.

## Appendix
- Repository README: see `README.md` for quick setup.
- Supabase schema & seeds: see `supabase/schema.sql` and `supabase/seed.sql`.
