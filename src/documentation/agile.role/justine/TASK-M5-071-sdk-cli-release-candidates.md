# TASK-M5-071: SDK/CLI Release Candidates

## Metadata
- Assignee: Justine
- Role: CPOO/Product Lead
- Month: 5 (February 2026)
- Priority: P1
- Status: BACKLOG
- Due Date: 2026-02-20
- Estimated Hours: 12h
- Actual Hours: 

## Problem
SDK and CLI not ready for external use. Without release candidates:
- External developers cannot integrate
- No stable version to reference
- Migration unclear from internal builds
- Missing examples

## Goal
Tag and publish release candidate versions of SDK and CLI for Metis and Hyperion support, with clear changelog, migration notes from earlier internal builds, and at least two realistic examples per network.

## Success Metrics
- SDK RC published to npm
- CLI RC published
- Changelog complete
- Migration notes written
- 2+ examples per network
- Used in 3+ external projects

## Technical Scope

Files to create/modify:
```
packages/
├── sdk/
│   ├── CHANGELOG.md
│   └── MIGRATION.md
└── cli/
    ├── CHANGELOG.md
    └── examples/
```

Dependencies:
- npm publishing
- Version tagging

## Acceptance Criteria
- [ ] SDK RC tagged and published
- [ ] CLI RC tagged and published
- [ ] Changelog complete
- [ ] Migration notes written
- [ ] Examples provided (2+ per network)
- [ ] Documentation updated
- [ ] Used in 3+ external projects

## Dependencies
- TASK-M5-068: Public Beta Launch

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes
Month 5 release preparation.

