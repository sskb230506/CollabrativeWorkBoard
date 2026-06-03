# CollaborativeWorkBoard

A production-grade Real-Time Collaborative Workboard — built with the same architecture as Trello/Linear.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React · TypeScript · Vite · TailwindCSS · React Query · Socket.IO Client |
| **Backend** | Node.js · Express · TypeScript |
| **Database** | PostgreSQL via [Neon](https://neon.tech) |
| **ORM** | [Prisma](https://prisma.io) |
| **Cache** | Redis via [Upstash](https://upstash.com) |
| **Realtime** | Socket.IO |
| **Background Jobs** | BullMQ |
| **Storage** | Cloudinary |
| **Frontend Deploy** | Vercel |
| **Backend Deploy** | Render |
| **CI/CD** | GitHub Actions |
| **Monitoring** | OpenTelemetry · Pino |

---

## Architecture Principles

- **Multi-Tenant** — Every query is scoped to an `organizationId`
- **RBAC** — Role hierarchy: `OWNER > ADMIN > MEMBER > VIEWER`
- **Repository Pattern** — No raw Prisma calls outside repository classes
- **Service Layer** — Business logic is transport-agnostic (HTTP/WebSocket/gRPC-ready)
- **SOLID** — Interfaces for every repository, injectable services

---

## Repository Structure

```
CollaborativeWorkBoard/
├── backend/            ← Node.js / Express / Prisma API
│   ├── prisma/         ← Schema + migrations
│   ├── src/
│   │   ├── config/     ← Env validation (Zod) + typed app config
│   │   ├── lib/        ← Logger, Redis, errors, API helpers
│   │   ├── middleware/ ← Auth, RBAC, validation, rate limiting
│   │   ├── modules/    ← Feature vertical slices (auth, boards, cards…)
│   │   ├── queue/      ← BullMQ jobs + workers
│   │   ├── repositories/ ← Abstract BaseRepository
│   │   ├── routes/     ← Central API v1 router
│   │   ├── types/      ← Global TypeScript types
│   │   ├── websocket/  ← Socket.IO server + handlers
│   │   ├── app.ts      ← Express factory
│   │   └── server.ts   ← Entry point + graceful shutdown
│   ├── Dockerfile
│   └── .env.example
├── frontend/           ← React / Vite (scaffolded separately)
├── render.yaml         ← Render IaC deployment config
└── .github/workflows/  ← GitHub Actions CI
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- A [Neon](https://neon.tech) PostgreSQL database
- An [Upstash](https://upstash.com) Redis instance

### Backend Setup

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Fill in your DATABASE_URL, JWT secrets, Upstash credentials, etc.

# 3. Generate Prisma client
npm run db:generate

# 4. Run migrations
npm run db:migrate

# 5. Start dev server
npm run dev
```

The API will be available at `http://localhost:5000`.

### Health Check

```
GET http://localhost:5000/health
GET http://localhost:5000/api/v1/health/ready
```

---

## API Endpoints (v1)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Create account |
| `POST` | `/api/v1/auth/login` | Login |
| `POST` | `/api/v1/auth/refresh` | Refresh tokens |
| `POST` | `/api/v1/auth/logout` | Logout |
| `GET` | `/api/v1/auth/me` | Current user |
| `GET` | `/api/v1/organizations` | List organizations |
| `POST` | `/api/v1/organizations` | Create organization |
| `GET` | `/api/v1/organizations/:orgId/boards` | List boards |
| `POST` | `/api/v1/organizations/:orgId/boards` | Create board |
| `GET` | `/api/v1/health` | Liveness check |
| `GET` | `/api/v1/health/ready` | Readiness check (DB + Redis) |

---

## Deployment

### Backend → Render

1. Connect this GitHub repo to [Render](https://render.com)
2. Render will auto-detect `render.yaml`
3. Set the secret environment variables in the Render dashboard (`sync: false` vars)
4. Deploy — migrations run automatically on startup

### Frontend → Vercel

1. Connect the `/frontend` directory to Vercel
2. Set `VITE_API_URL` to your Render backend URL
3. Deploy

---

## Environment Variables

See [`backend/.env.example`](./backend/.env.example) for the full list.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feat/your-feature`
5. Open a Pull Request

---

## License

MIT
