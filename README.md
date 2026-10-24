# Tastebook

A recipe hub. Built with [mb-factory](https://github.com/milobedini/mb-factory): issues in Linear go through triage, spec, implement and review, and come back as pull requests for a human to merge.

## Stack

- `frontend/`: React 19, Vite, TanStack Query, react-router, Vitest, MSW, Playwright, Biome, TypeScript 7
- `backend/`: Django, Django REST framework, Postgres, drf-spectacular, pytest, ruff, uv

## Getting started

Needs Node 24+, pnpm, uv and Docker.

```sh
docker compose up -d --wait
pnpm install
(cd backend && uv sync && uv run python manage.py migrate)
(cd backend && uv run python manage.py runserver) &
pnpm dev
```

Open <http://localhost:5173>. The API is at <http://localhost:8000/api/>, with its docs at `/api/schema/docs/`.

## Working here

Read [AGENTS.md](AGENTS.md): it covers conventions, commands, the API contract, specs and PRs, for people and agents alike.
