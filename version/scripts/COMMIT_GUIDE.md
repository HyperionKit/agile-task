# Git Commit Automation Guide

Task-aware commit automation aligned with HyperKit Agile workflow.

## Quick Start

```bash
# Preview commits (always run first)
npm run commit:dry

# Commit all changes
npm run commit

# Bash version (faster)
npm run commit:sh

# Single commit for all
npm run commit:all
```

## Task-Aware Commit Messages

The scripts detect task files and generate appropriate messages:

### Task Files (TASK-S[X]-[XXX]-name.md)

| Location | Action | Message Format |
|----------|--------|----------------|
| agile.role/[name]/ | New | `task(TASK-S1-001): create setup github monorepo` |
| agile.role/[name]/ | Update | `task(TASK-S1-001): update setup github monorepo` |
| deliver/ | Complete | `task(TASK-S1-001): complete setup github monorepo` |
| overdue/[name]/ | Escalate | `task(TASK-S1-001): [P0] escalate setup github monorepo` |

### Other Files

| File Type | Message Format |
|-----------|----------------|
| SPRINT_OVERVIEW.md | `sprint: update sprint overview` |
| TASK_TEMPLATE.md | `docs: update task template` |
| Reference docs | `docs: update reference [filename]` |
| CI/CD files | `ci: update [filename]` |
| Other files | `feat/update/remove: [action] [filename]` |

## Task File Naming

Follow the template convention:
```
TASK-S[Sprint]-[Number]-[short-description].md

Examples:
- TASK-S1-001-setup-github-monorepo.md
- TASK-S2-015-claude-integration.md
- TASK-S0-P0-001-role-signature-verification.md
```

## Workflow Integration

### Daily Development

```bash
# 1. Work on tasks in agile.role/[your-name]/
# 2. Preview changes
npm run commit:dry

# 3. Commit (P0 tasks committed first)
npm run commit

# 4. Push
git push
```

### Completing a Task

```bash
# 1. Move task file to deliver/
mv src/documentation/agile.role/aaron/TASK-S1-001-*.md \
   src/documentation/deliver/sprint-1/

# 2. Commit (auto-generates "complete" message)
npm run commit
# Output: task(TASK-S1-001): complete setup github monorepo
```

### Escalating Overdue Task

```bash
# 1. Move task to overdue/
mv src/documentation/agile.role/justine/TASK-S1-003-*.md \
   src/documentation/overdue/justine/

# 2. Commit (auto-generates P0 message)
npm run commit
# Output: task(TASK-S1-003): [P0] escalate database setup
```

## Priority Ordering

Commits are processed in priority order:

1. **P0/Overdue** - Critical tasks first
2. **Tasks** - Active sprint tasks
3. **Deliver** - Completed tasks
4. **Reference** - Documentation
5. **CI/Scripts** - Infrastructure
6. **Other** - Everything else

## Configuration

### Adjust Concurrency

```bash
bash version/scripts/parallel-commit.sh --max 3
```

### Exclude Patterns

Edit `parallel-commit.js`:
```javascript
excludePatterns: [
  'node_modules/**',
  '.git/**',
  '*.log',
  '*.tmp'
]
```

## Commands Reference

| Command | Description |
|---------|-------------|
| `npm run commit` | Task-aware parallel commit |
| `npm run commit:dry` | Preview commits |
| `npm run commit:sh` | Bash script version |
| `npm run commit:all` | Single commit for all |
| `npm run status` | Git status |
| `npm run changes` | List changed files |

## Example Output

```
========================================
HyperKit Parallel Commit
Task-Aware Version
========================================

Scanning for changes...

Found 5 changed files:
  + [P0] src/documentation/overdue/aaron/TASK-S0-P0-001-role-signature.md
  ~ [TASK] src/documentation/agile.role/aaron/TASK-S1-001-setup-monorepo.md
  + [TASK] src/documentation/agile.role/justine/TASK-S1-006-contracts.md
  ~ [DOCS] src/documentation/reference/HyperKit-Technical-Implementation.md
  ~ [OTHER] README.md

Categories:
  [P0] 1 files
  [TASK] 2 files
  [DOCS] 1 files
  [OTHER] 1 files

Processing commits (max 5 concurrent)...

Committed: "src/documentation/overdue/aaron/TASK-S0-P0-001-role-signature.md"
  Message: "task(TASK-S0-P0-001): [P0] escalate role signature verification"

========================================
COMMIT SUMMARY
========================================
Total: 5 files
Success: 5
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Script not found | Run from repository root |
| Permission denied | `chmod +x version/scripts/parallel-commit.sh` |
| No task ID detected | Check filename follows TASK-S[X]-[XXX] pattern |
| Wrong category | Check file is in correct directory |
