# Reading Time Warp

![Status](https://img.shields.io/badge/Status-Active%20Prototype-1f8f6a)
![Cloud](https://img.shields.io/badge/Cloud-Azure%20Static%20Web%20Apps-2f6fed)
![Security](https://img.shields.io/badge/Security-Auth%20%2B%20Server--Side%20Data%20Flow-f59e0b)

Reading Time Warp is an adaptive reading assessment platform that combines a browser-based quiz experience with authenticated cloud APIs and Cosmos DB persistence.

Live demo:
[https://happy-meadow-0c1a27010.7.azurestaticapps.net/](https://happy-meadow-0c1a27010.7.azurestaticapps.net/)

## Why This Project Matters For My Portfolio

I am building this as my primary portfolio project while transitioning toward network engineering and cybersecurity analyst roles.

This project demonstrates practical skills in:

- Identity-aware application design
- Secure client/server separation
- API hardening and input validation
- Cloud deployment and troubleshooting
- Incident response and root-cause analysis

## What It Does Today

- Adaptive reading-level quiz flow for grades 1 to 6
- Mixed question bank (CSV and JSON formats)
- Choose-your-own-adventure reading stories by grade and theme
- Microsoft/Azure sign-in through Azure Static Web Apps auth
- Authenticated profile and score storage in Cosmos DB through backend APIs
- Sign-in dashboard with recent score history and progress sharing workflow

## Architecture Snapshot

Frontend and backend responsibilities are intentionally separated.

- Frontend: renders quiz, stories, and dashboard UI
- Auth boundary: Azure Static Web Apps authentication (`/.auth/*`)
- API layer: Azure Functions endpoints for profile, score, and sharing operations
- Data layer: Cosmos DB records tied to authenticated users

Security-oriented design choice:

- Data writes happen server-side through authenticated APIs, not direct browser-to-database calls

## Security And Reliability Work Already Completed

Recent changes that improved production safety:

- Moved profile and score persistence into authenticated backend endpoints
- Added server-side normalization for auth principal claims
- Added grade input hardening and bounded score history
- Removed temporary debug endpoint and debug UI after incident troubleshooting
- Hardened route handling so platform and API paths are not rewritten by SPA fallback

## Technology Stack

- HTML, CSS, JavaScript
- Azure Static Web Apps
- Azure Functions (Node.js)
- Azure Static Web Apps Authentication
- Azure Cosmos DB (`@azure/cosmos`)
- JSON and CSV content banks

## Project Layout

```text
frontend/                 UI, quiz logic, story reader, content banks
api/                      Azure Functions endpoints and shared auth helpers
swa-db-connections/       SWA database config and GraphQL schema files
staticwebapp.config.json  SWA routing and navigation fallback config
README.md                 Project overview and roadmap
```

## Screenshots

![MVP Screenshot](./mvp.png)
![Running App Screenshot](./mvp_running.png)
![App Architecture](./appArchitecture.png)

## Portfolio Roadmap: Network + Cybersecurity Alignment

Next milestones are selected to better demonstrate SOC-style and infrastructure-focused skills.

1. API Abuse Controls
- Add per-endpoint rate limiting and cooldowns, especially for share-progress email routes
- Add stricter request schema validation and payload limits

2. Observability And Telemetry
- Add structured logs with correlation IDs
- Track auth failures, API failures, and write/read latency
- Document an incident-response playbook in the repo

3. Security Testing Baseline
- Add automated tests for auth checks, input validation, and edge-case failures
- Add dependency and secret scanning checks in CI

4. Data Governance Improvements
- Evolve profile schema from simple score arrays to timestamped attempt records
- Add retention/cleanup strategy and privacy-focused data handling notes

5. Network And Threat Modeling Artifacts
- Add a network/data-flow diagram with trust boundaries
- Add a lightweight threat model (entry points, abuse paths, mitigations)

## Quick Start

1. Install dependencies:

```bash
npm install
cd api && npm install
```

2. Run locally with Azure Static Web Apps CLI (recommended for auth + API emulation).

3. Configure required environment settings in Azure for deployed runs:
- `COSMOSDB_CONNECTION_STRING` must be the full connection string

## Current Focus

This repository is actively maintained. Priority work is security hardening, observability, and measurable reliability improvements while expanding classroom value.
