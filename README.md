# NSWI153 Repository

WebCrawler semestral project.

## Structure

- `backend` - TypeScript, Node.js, Express 5, Prisma 7.8, Swagger/OpenAPI.
- `frontend` - React, TypeScript, Vite, Cytoscape.js-ready UI shell.
- `crawler` - TypeScript crawler service with Cheerio parsing helper.
- `graphql` - Apollo Server with the required GraphQL schema shape.
- `docker-compose.yml` - PostgreSQL 18 plus all application services.

Copy `.env.example` to `.env` before customizing local ports or database credentials.

## Running

Use Docker Compose as the default way to run the project:

```powershell
Copy-Item .env.example .env
docker compose up
```

If dependencies or Dockerfiles changed, rebuild the images:

```powershell
docker compose up --build
```

Open the frontend at:

```text
http://localhost:5173
```

Useful development URLs:

- Backend health: `http://localhost:3000/health`
- Swagger docs: `http://localhost:3000/docs`
- Crawler health: `http://localhost:3001/health`
- GraphQL: `http://localhost:4000`

Stop the project with:

```powershell
docker compose down
```
