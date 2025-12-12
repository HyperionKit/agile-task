# Task Template Guide

## File Naming Convention

```
TASK-S[Sprint]-[Number]-[Short-Description].md

Examples:
- TASK-S1-001-setup-github-monorepo.md
- TASK-S2-015-claude-integration.md
- TASK-S3-030-erc4337-contracts.md
```

## Task Status Values

| Status | Description |
|--------|-------------|
| BACKLOG | Not started, in queue |
| IN_PROGRESS | Currently being worked on |
| REVIEW | Completed, awaiting review |
| DONE | Approved and complete |
| BLOCKED | Cannot proceed (document blocker) |
| OVERDUE | Past due date, requires P0 attention |

## Priority Levels

| Priority | Description |
|----------|-------------|
| P0 | Critical/Overdue. Immediate action required |
| P1 | High. Must complete this sprint |
| P2 | Medium. Should complete this sprint |
| P3 | Low. Nice to have |

## Task File Structure

```markdown
# TASK-S[X]-[XXX]: [Task Title]

## Metadata
- Assignee: [Name]
- Role: [CTO/CPOO/CMFO]
- Sprint: [1-N]
- Priority: [P0-P3]
- Status: [BACKLOG/IN_PROGRESS/REVIEW/DONE/BLOCKED/OVERDUE]
- Due Date: YYYY-MM-DD
- Estimated Hours: [X]h
- Actual Hours: [X]h

## Problem
[What specific issue does this task solve?]
[What is the current state?]
[What pain point does it address?]

## Goal
[What is the desired outcome?]
[What does success look like?]
[How does it contribute to MVP?]

## Success Metrics
- [Measurable criterion 1]
- [Measurable criterion 2]
- [Performance target]

## Technical Scope
Files to create/modify:
- [file path 1]
- [file path 2]

Dependencies:
- [package/library]

Integration points:
- [system/component]

## Minimal Code
[Skeleton code, pseudocode, or interface definition]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Dependencies
- [TASK-ID]: [Description]
- [External dependency]

## Progress Log
| Date | Update | Hours |
|------|--------|-------|
| YYYY-MM-DD | [Update] | Xh |

## Review Notes
[Reviewer comments after completion]
```

## Workflow

1. New Task: Created in `agile.role/[assignee]/`
2. Completed: Move to `deliver/sprint-X/`
3. Overdue: Move to `overdue/[assignee]/` with P0 priority

## Sprint Schedule

| Sprint | Weeks | Focus | Key Deliverables |
|--------|-------|-------|------------------|
| S1 | 1-2 | Infrastructure & Foundation | Monorepo, CI/CD, Database, RPC |
| S2 | 3-4 | Core HyperAgent | Claude, ROMA, Multi-model router |
| S3 | 5-6 | Account Abstraction | ERC-4337, EntryPoint, Foundry |
| S4 | 7-8 | Testing & MVP Launch | E2E tests, Dashboard, Alpha |
| S5 | 9-10 | Solana Integration | Anchor, Phantom, Devnet |
| S6 | 11-12 | SUI Move + Cross-Chain | Move compiler, CCIP |
| S7 | 13-14 | x402 & Monetization | Billing, Revenue settlement |
| S8 | 15-16 | Security & Privacy | TEE, Encryption, Audit |
| S9 | 17-18 | Advanced Features | RAG, Marketplace, Governance |
| S10 | 19-20 | Mainnet Preparation | Deploy, TGE, Series A |

## Quality Gates

Each task must pass:
- Code review by 2 team members
- Unit test coverage above 80%
- Integration tests passing
- Documentation updated
- No P0 bugs open
- Performance benchmarks met

## MVP Success Criteria

- Build success rate: 95%+
- API uptime: 99.5%+
- Response time p95: under 2 seconds
- Error rate: under 0.1%
- Security scan: Zero critical findings
