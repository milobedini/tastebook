# Tastebook

A recipe hub. Built with [mb-factory](https://github.com/milobedini/mb-factory): issues in Linear go through triage, spec, implement and review, and come back as pull requests for a human to merge.

## Stack

- `frontend/`: React 19, Vite, TanStack Query, react-router, Vitest, MSW, Playwright, Biome, TypeScript 7
- `backend/`: Django, Django REST framework, Postgres, drf-spectacular, pytest, ruff, uv

## Getting started

Needs Node 24+, pnpm, uv and Docker.

```sh
pnpm dev
```

This starts Postgres in Docker, installs dependencies, creates `backend/.env` if it's missing, applies migrations, then runs the API and the frontend together. Ctrl+C stops both servers; Postgres keeps running until `docker compose down`.

Open <http://localhost:5173>. The API is at <http://localhost:8000/api/>, with its docs at `/api/schema/docs/`.

## Previews and production

Every PR gets a preview on Vercel with its own database; the Vercel bot comments its URL on the PR. Merging to `main` deploys production at <https://tastebook.dev>. How it's hosted is in [docs/architecture.md](docs/architecture.md#where-it-runs).

## Working here

Read [AGENTS.md](AGENTS.md): it covers conventions, commands, the API contract, specs and PRs, for people and agents alike.
