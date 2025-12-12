# REPORTS
![Alt](https://repobeats.axiom.co/api/embed/41644f768f2c1be7bad561c325717886a30683a3.svg "Repobeats analytics image")

## Overview

HyperKit Project Requirements Documentation (PRD) repository. Central hub for project management, task tracking, and technical documentation.

## Quick Start

### Prerequisites

- Node.js 18.0+
- Git

### Setup

```bash
git clone https://github.com/your-org/PRD.git
cd PRD
npm install
```

### Commit Changes

```bash
# Preview changes (recommended first step)
npm run commit:dry

# Commit all changes with auto-generated messages
npm run commit

# Single commit for all changes
npm run commit:all

# Push to remote
git push
```

## Project Structure

```
PRD/
├── .github/
│   └── workflows/           # CI/CD pipelines
├── src/
│   ├── documentation/
│   │   ├── agile.role/      # Active sprint tasks
│   │   │   ├── aaron/       # CTO tasks
│   │   │   ├── justine/     # CPOO tasks
│   │   │   └── tristan/     # CMFO tasks
│   │   ├── deliver/         # Completed tasks
│   │   ├── overdue/         # P0 overdue tasks
│   │   │   ├── aaron/
│   │   │   ├── justine/
│   │   │   └── tristan/
│   │   └── reference/       # Reference docs
│   └── technical/
│       ├── pdf/             # Technical PDFs
│       └── role/            # Team role definitions
├── version/
│   └── scripts/             # Automation scripts
├── CODEOWNERS
└── package.json
```

## Agile Task Management

### Team Roles

| Member | Role | Focus Areas |
|--------|------|-------------|
| Aaron | CTO/Project Architect | Backend, APIs, security, code audits |
| Justine | CPOO/Product Lead | Smart contracts, product, docs, partnerships |
| Tristan | CMFO/Frontend | UI/frontend, marketing, presentations |

### Task Workflow

```
1. New Task Created
   └── agile.role/[assignee]/TASK-S[X]-[XXX]-[name].md

2. Task In Progress
   └── Status: IN_PROGRESS

3. Task Complete
   └── Move to: deliver/sprint-X/

4. Task Overdue (P0)
   └── Move to: overdue/[assignee]/
```

### Task Naming Convention

```
TASK-S[Sprint]-[Number]-[short-description].md

Examples:
- TASK-S1-001-setup-github-monorepo.md
- TASK-S2-015-claude-integration.md
```

### Current Sprint Status

| Assignee | Active | Overdue (P0) |
|----------|--------|--------------|
| Aaron | 5 | 2 |
| Justine | 4 | 1 |
| Tristan | 3 | 0 |

### Task Guides

- [Task Template](./src/documentation/agile.role/TASK_TEMPLATE.md)
- [Sprint Overview](./src/documentation/agile.role/SPRINT_OVERVIEW.md)
- [Role Definitions](./src/technical/role/Hyperkit_%20Role%20%26%20Title.md)

## Commands

| Command | Description |
|---------|-------------|
| `npm run commit` | Parallel commit with auto-messages |
| `npm run commit:dry` | Preview commits (no execution) |
| `npm run commit:sh` | Bash script version |
| `npm run commit:all` | Single commit for all files |
| `npm run status` | Git status |
| `npm run changes` | List changed files |

## Documentation

### Reference Docs

- [Complete Implementation Guide](./src/documentation/reference/HyperKit-Complete-Implementation-Guide.md)
- [Technical Implementation](./src/documentation/reference/HyperKit-Technical-Implementation.md)
- [Final Proposal v2](./src/documentation/reference/HyperKit-Final-Proposal%20v2.md)
- [Security Documentation](./src/documentation/reference/HyperKit%20Security%20Defending%20Against.md)

### Technical PDFs

- [Architecture Full System](./src/technical/pdf/HyperKit_Architecture_Full_System.pdf)
- [HyperAgent Architecture](./src/technical/pdf/HyperAgent_Technical_Archicture.pdf)
- [Smart Wallet Architecture](./src/technical/pdf/AA_Repository_Smart_Wallet_Architecture.pdf)

### Guides

- [Commit Automation Guide](./version/scripts/COMMIT_GUIDE.md)

## Team

| Member | GitHub | Role | Responsibilities |
|--------|--------|------|------------------|
| Aaron | [@ArhonJay](https://github.com/ArhonJay) | CTO/Architect | Backend, APIs, security |
| Justine | [@Justinedevs](https://github.com/Justinedevs) | CPOO/Product | Contracts, docs, partnerships |
| Tristan | [@Tristan-T-Dev](https://github.com/Tristan-T-Dev) | CMFO/Frontend | UI, marketing, presentations |

## CI/CD Workflows

### Push Events

When you push to main:
```
Commit[abc1234]
@username [CODEOWNER]
```

### Pull Requests

When you open a PR:
```
PR#123
Commit[abc1234]
@username [CODEOWNER]
```

Labels added automatically:
- `documentation` - All PRs
- `codeowner` or `contributor` - Based on author

## Contributing

1. Create a branch from `main`
2. Make changes
3. Preview: `npm run commit:dry`
4. Commit: `npm run commit`
5. Push and create PR

All PRs require CODEOWNER review.

## License

All Rights Reserved. See [LICENSE](./LICENSE) for details.

This repository is viewable on GitHub per platform Terms of Service. 
Using, copying, or distributing contents outside GitHub requires explicit permission.
