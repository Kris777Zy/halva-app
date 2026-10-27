# CLAUDE.md

## Deployment
- This app runs on Render, not on the local computer.
- It is deployed automatically from the `main` branch of this GitHub repo (https://github.com/Kris777Zy/halva-app) as a Node web service.

## Database
- The database is a Render PostgreSQL database.
- It is available only through the `DATABASE_URL` environment variable on Render.
- Do NOT set up a local database.

## Server
- Do NOT set up or run a local server.
- The server must listen on the port given by the `PORT` environment variable (`process.env.PORT`).

## Workflow
- Before every push, run `npm run build` to make sure the app builds.
- After each finished task, commit and push to GitHub (`main`) so that Render deploys the new version.
