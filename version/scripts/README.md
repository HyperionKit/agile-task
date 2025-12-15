# Scripts Documentation

Quick reference guide for all available scripts and commands.

## Git Commits

### Basic Commits
```bash
npm run commit              # Auto-commit all changes (task-aware)
npm run commit:dry          # Preview commits without executing
npm run commit:sh           # Bash version of commit script
npm run commit:auto         # Auto-commit with max 3 concurrent
```

### Git Status
```bash
npm run status              # Show git status
npm run changes             # Show changed files
npm run staged              # Show staged files
```

## GitHub Issues

### Issue Management
```bash
npm run issue:create        # Create issue from task file
npm run issue:create:dry   # Preview issue creation (dry-run)
npm run issue:sync          # Sync all task files to issues
npm run issue:sync:changed  # Sync only changed task files
npm run issue:update        # Update issue statuses from task files
npm run issue:close         # Close issues for completed tasks
npm run issue:setup-labels  # Create all GitHub labels
npm run issue:sync-project  # Sync GitHub Project views (Backlog/Board/Roadmap)
```

## Task Management

### Task Automation
```bash
npm run task:move-completed # Move DONE tasks to deliver/ directory
```

## Environment Setup

### Required Environment Variables
Create a `.env` file in the project root:

```bash
# GitHub Configuration
GITHUB_REPO_NAME=HyperionKit/agile-task
GITHUB_PROJECT_OWNER=HyperionKit
GITHUB_PROJECT_NUMBER=1
GITHUB_TOKEN=ghp_your_token_here

# Optional: Security Keys
ROLE_SIGNING_PUBLIC_KEY=your_public_key_hex

# Optional: API Keys
THIRDWEB_API_KEY=your_key
LAZAI_API_KEY=your_key
SOCKET_API_KEY=your_key
```

Get GitHub token from: https://github.com/settings/tokens
Required scopes: `repo`, `read:org`, `project`

## Common Workflows

### Daily Workflow
```bash
# 1. Check what changed
npm run changes

# 2. Sync issues with GitHub
npm run issue:sync-project

# 3. Move completed tasks
npm run task:move-completed

# 4. Commit changes
npm run commit
```

### Creating New Task
```bash
# 1. Create task file in agile.role/[assignee]/
# 2. Create GitHub issue
npm run issue:create src/documentation/agile.role/aaron/TASK-M3-XXX.md

# 3. Sync to project
npm run issue:sync-project
```

### Completing Task
```bash
# 1. Update task file: Status: DONE
# 2. Move to deliver directory
npm run task:move-completed

# 3. Close GitHub issue
npm run issue:close

# 4. Commit changes
npm run commit
```

## Script Files

| Script | Purpose |
|--------|---------|
| `parallel-commit.js` | Auto-commit with task-aware messages |
| `create-task-issue.js` | Create GitHub issues from task files |
| `sync-task-issues.js` | Batch sync all task files to issues |
| `update-issue-statuses.js` | Update issue status from task metadata |
| `close-completed-issues.js` | Close issues for delivered tasks |
| `setup-labels.js` | Create GitHub labels |
| `sync-project-issues.js` | Sync GitHub Project fields (Status, Priority, Iteration, Dates) |
| `move-completed-tasks.js` | Auto-move DONE tasks to deliver/ directory |

## GitHub Actions

The `.github/workflows/auto-create-issues.yml` workflow automatically:
- Creates issues when task files are added/modified
- Syncs project views when tasks are updated
- Moves completed tasks to deliver/ directory
- Closes issues when tasks are completed

## Troubleshooting

### Issue: "GITHUB_TOKEN not found"
- Create `.env` file with `GITHUB_TOKEN=your_token`
- Get token from: https://github.com/settings/tokens

### Issue: "Iteration field not found"
- Check if "Iteration" field exists in your GitHub Project
- Verify field name matches exactly (case-sensitive)

### Issue: "Permission denied"
- Ensure GitHub token has `project` scope
- Run `gh auth refresh` to update token

## Quick Reference

```bash
# Most common commands
npm run commit              # Commit changes
npm run issue:sync-project  # Sync project views
npm run task:move-completed # Move done tasks
```

