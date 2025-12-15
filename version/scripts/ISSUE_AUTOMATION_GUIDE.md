# GitHub Issue Automation Guide

This guide explains how to use the automated GitHub issue creation and synchronization system for PRD task files.

## Overview

The system automatically creates, updates, and closes GitHub issues based on PRD task files in:
- `src/documentation/agile.role/` - Active tasks
- `src/documentation/deliver/` - Completed tasks
- `src/documentation/overdue/` - Overdue tasks

## GitHub Projects Integration

Issues are automatically added to GitHub Projects and synced across views:
- **Backlog**: Shows all issues (filtered by status)
- **Board**: Kanban view with status columns
- **Current iteration**: Active sprint items
- **Roadmap**: Timeline view by month/sprint

The system automatically:
- Adds new issues to the project
- Updates project status field when task status changes
- Syncs status across all project views
- Moves items between views based on status labels

### Project Configuration

Set environment variables to configure project:
```bash
# In your .env file:
GITHUB_PROJECT_NUMBER=1  # Your project number
GITHUB_PROJECT_OWNER=HyperionKit  # Project owner

# Or export in your shell:
export GITHUB_PROJECT_NUMBER=1
export GITHUB_PROJECT_OWNER=HyperionKit
```

Or in GitHub Actions, add to workflow:
```yaml
env:
  GITHUB_PROJECT_NUMBER: "1"
  GITHUB_PROJECT_OWNER: "HyperionKit"
```

## Setup

### 1. Install Dependencies

```bash
npm install
```

This installs `dotenv` which loads environment variables from `.env` file.

### 2. Configure Environment Variables

**Required**: Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
# Edit .env with your actual GitHub token and project settings
```

**Important**: The `GITHUB_TOKEN` is now **required**. Get it from:
- https://github.com/settings/tokens
- Required scopes: `repo`, `read:org`, `read:project`, `write:project`

### 3. Install GitHub CLI

```bash
# macOS
brew install gh

# Linux
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# Windows
winget install GitHub.cli
```

### 2. Authenticate GitHub CLI

```bash
gh auth login
```

### 3. Setup Labels

Run once to create all required labels:

```bash
npm run issue:setup-labels
```

## Manual Usage

### Create Issue for Single Task

```bash
npm run issue:create src/documentation/agile.role/aaron/TASK-M3-AA-001-entrypoint-v07.md
```

### Dry Run (Test Without Creating)

```bash
npm run issue:create:dry src/documentation/agile.role/aaron/TASK-M3-AA-001-entrypoint-v07.md
```

### Sync All Tasks

```bash
# Sync all tasks
npm run issue:sync

# Sync only changed tasks
npm run issue:sync:changed
```

### Update Issue Statuses

```bash
npm run issue:update
```

### Close Completed Issues

```bash
npm run issue:close
```

### Sync Project Issues

Sync all issues to GitHub Project (ensures all issues are in project):

```bash
npm run issue:sync-project
```

## Automated Workflows

### Push Trigger

When you push changes to task files, the workflow automatically:
- Detects changed task files
- Creates issues for new tasks
- Updates issues for modified tasks
- Closes issues for tasks moved to `deliver/`
- Adds overdue labels for tasks moved to `overdue/`

### Manual Workflow Dispatch

Go to Actions → "Auto-Create Issues from Tasks" → Run workflow

Options:
- **create-all**: Create issues for all tasks
- **sync-all**: Sync all tasks (create/update)
- **update-statuses**: Update issue status labels only
- **close-completed**: Close issues for completed tasks

## Issue Format

Each issue includes:

```
📋 **PRD Reference**: [Link to task file]

**Owner**: @username
**Sprint**: S[X]
**Start Date**: YYYY-MM-DD
**Target Date**: YYYY-MM-DD

---

## Problem
[From task file]

## Goal
[From task file]

## Metadata
- Priority, Status, Estimated Hours, Role

## Acceptance Criteria
See PRD Reference for full details
```

## Label System

### Priority Labels
- `priority:critical` (P0)
- `priority:high` (P1)
- `priority:medium` (P2)
- `priority:low` (P3)

### Status Labels
- `status:backlog`
- `status:in-progress`
- `status:review`
- `status:done`
- `status:blocked`
- `status:overdue`

### Category Labels
- `category:hyperagent` (for HA-* tasks)
- `category:sdk` (for SDK-* tasks)
- `category:account-abstraction` (for AA-* tasks)
- `category:security` (for SEC-* tasks)
- `category:frontend` (for UI/UX tasks)

### Month Labels
- `month:1` through `month:6`

### Type Label
- `type:task` (all task issues)

## Assignee Mapping

- Aaron → @ArhonJay
- Justine → @Justinedevs
- Tristan → @Tristan-T-Dev

## Rate Limiting

The system implements rate limiting to avoid GitHub API limits:
- 2 second delay between individual issue operations
- 10 second delay between batches (10 tasks per batch)
- Maximum 50 issues per workflow run

## Logging

All operations are logged to `.github/logs/issue-sync.log`:
- Issue creation
- Issue updates
- Issue closures
- Errors and warnings

## Troubleshooting

### Issue Not Created

1. Check if issue already exists:
   ```bash
   gh issue list --search "TASK-M3-AA-001"
   ```

2. Check logs:
   ```bash
   tail -50 .github/logs/issue-sync.log
   ```

3. Run with dry-run to see what would happen:
   ```bash
   npm run issue:create:dry <task-file>
   ```

### Duplicate Issues

The system checks for existing issues by task ID. If duplicates exist:
1. Close the duplicate manually
2. Re-run sync to create correct issue

### Authentication Errors

```bash
# Re-authenticate
gh auth login

# Check authentication
gh auth status
```

### Rate Limit Errors

If you hit rate limits:
1. Wait 1 hour (GitHub resets hourly)
2. Use batch processing (already implemented)
3. Process fewer tasks at once

## Best Practices

1. **Always test with dry-run first**:
   ```bash
   npm run issue:create:dry <task-file>
   ```

2. **Run label setup once** before creating issues:
   ```bash
   npm run issue:setup-labels
   ```

3. **Use workflow dispatch** for bulk operations instead of manual scripts

4. **Check logs** after automated runs to verify success

5. **Update task files** - The system automatically adds GitHub issue URLs to task files

## Workflow Triggers

The workflow triggers on:
- Push to `agile.role/**/*.md`
- Push to `deliver/**/*.md`
- Push to `overdue/**/*.md`
- Manual workflow dispatch

## File Structure

```
version/scripts/
├── create-task-issue.js      # Main issue creation/sync script
├── sync-task-issues.js       # Batch processing script
├── update-issue-statuses.js  # Status update script
├── close-completed-issues.js # Close completed tasks
├── setup-labels.js           # Label creation script
└── ISSUE_AUTOMATION_GUIDE.md # This file

.github/
├── workflows/
│   └── auto-create-issues.yml # GitHub Actions workflow
├── ISSUE_TEMPLATE/
│   └── task.md                # Issue template
└── logs/
    └── issue-sync.log         # Operation logs
```

## Support

For issues or questions:
1. Check logs in `.github/logs/issue-sync.log`
2. Review GitHub Actions workflow runs
3. Test with dry-run mode
4. Check GitHub CLI authentication

