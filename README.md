# NSWI153 Repository

WebCrawler semestral project.
The presentation video uploaded on YouTube: [https://youtu.be/v88GxtlUBO4](https://youtu.be/v88GxtlUBO4)

## Structure

- `backend` - TypeScript, Node.js, Express 5, Prisma 7.8, Swagger/OpenAPI.
- `frontend` - React, TypeScript, Vite, Cytoscape.js-ready UI shell.
- `crawler` - TypeScript crawler service with BullMQ workers and Cheerio parsing.
- `graphql` - Apollo Server with the required GraphQL schema shape.
- `docker-compose.yml` - PostgreSQL 18, Redis, and all application services.

Copy `.env.example` to `.env` before customizing local ports or database credentials.

## Running

Use Docker Compose as the default way to run the project:

```powershell
Copy-Item .env.example .env
docker compose up
```

The backend applies Prisma migrations on container startup.

If dependencies or Dockerfiles changed, rebuild the images:

```powershell
docker compose up --build
```

For a clean local database and queue, remove volumes before starting:

```powershell
docker compose down -v
docker compose up --build
```

Use the same reset if PostgreSQL rejects a value that exists in the current Prisma schema,
for example `invalid input value for enum "Periodicity": "NONE"`. That means the local
Docker volume was created from an older migration state.

Open the frontend at:

```text
http://localhost:5173
```

Useful development URLs:

- Backend health: `http://localhost:3000/health`
- Swagger docs: `http://localhost:3000/docs`
- Crawler health: `http://localhost:3001/health`
- GraphQL: `http://localhost:4000/graphql`
- GraphQL health: `http://localhost:4000/health`

## Current API

Implemented backend endpoints:

- `GET /api/websites`
- `POST /api/websites`
- `GET /api/websites/:id`
- `PATCH /api/websites/:id`
- `DELETE /api/websites/:id`
- `GET /api/executions`
- `GET /api/websites/:id/executions`
- `POST /api/websites/:id/executions`

Manual execution flow:

```powershell
$site = Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:3000/api/websites `
  -ContentType "application/json" `
  -Body '{"url":"https://example.com","boundaryRegexp":"^https://example.com/$","periodicity":"HOUR","label":"Example","active":true,"tags":["test"]}'

Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/api/websites/$($site.id)/executions"
```

Crawler results are stored in PostgreSQL as `CrawledPage`, `CrawledLink`, and `CrawlUrl` records.

## Checks

Run all TypeScript builds:

```powershell
npm run build
```

Run linting and formatting checks:

```powershell
npm run lint
npm run format:check
```
