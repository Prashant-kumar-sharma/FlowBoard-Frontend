# GitHub Actions CI/CD

This repository now uses a single GitHub Actions workflow:

- `deploy.yml`
  Runs install, test, and production build on pushes to `main`, `dev`, and `feature/**`, plus pull requests to `main` and `dev`.
  On `main`, the same workflow then builds and pushes the frontend Docker image and refreshes the `frontend` service on EC2 only after CI passes.

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
- Because CI and CD are in the same workflow, deployment cannot succeed when the test/build job fails.
- On non-`main` branches, the release jobs finish as no-op successes instead of showing as skipped.

## Suggested Branch Flow

Your current frontend work is on `feature/flowboard-frontend`.
If you want a dedicated CI/CD branch, create it from there:

```bash
git checkout feature/flowboard-frontend
git checkout -b feature/github-actions-cicd
git push -u origin feature/github-actions-cicd
```
