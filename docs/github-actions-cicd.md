# GitHub Actions CI/CD

This repository now includes:

- `frontend-ci.yml`
  Runs on pushes to `main`, `dev`, and `feature/**`, plus pull requests to `main` and `dev`.
  It installs dependencies, runs Angular unit tests in headless Chrome, and builds the production app.

- `frontend-cd.yml`
  Runs on pushes to `main` and on manual dispatch.
  It builds and pushes the frontend Docker image to Docker Hub.
  If the deployment secrets are configured, it also refreshes only the `frontend` service on your EC2 machine.

## Required GitHub Secrets

Add these repository secrets in `FlowBoard-Frontend`:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`
- `EC2_HOST`
- `EC2_USERNAME`
- `EC2_SSH_KEY`
- `SERVER_APP_PATH`

Notes:

- `SERVER_APP_PATH` should point to the backend repo path on the server, because that is where the shared `docker-compose.yml` lives.
- The deploy job is skipped automatically if the EC2 secrets are not present.

## Suggested Branch Flow

Your current frontend work is on `feature/flowboard-frontend`.
If you want a dedicated CI/CD branch, create it from there:

```bash
git checkout feature/flowboard-frontend
git checkout -b feature/github-actions-cicd
git push -u origin feature/github-actions-cicd
```
