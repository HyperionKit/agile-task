# TASK-M6-081: Network Split Analytics

## Metadata
- Assignee: Aaron
- Role: CTO/Project Architect
- Month: 6 (March 2026)
- Priority: P1
- Status: BACKLOG
- Due Date: 2026-03-25
- Estimated Hours: 6h
- Actual Hours: 

## Problem
No visibility into network usage distribution. Without analytics:
- Cannot see Metis vs Hyperion split
- Template adoption per network unknown
- Network preferences unclear
- No data for prioritization

## Goal
Add analytics showing network split (Metis vs Hyperion), template adoption per network, and usage distribution.

## Success Metrics
- Network split calculated
- Template adoption per network tracked
- Usage distribution visible
- Dashboard displays analytics
- Data accurate

## Technical Scope

Files to create/modify:
```
backend/
├── services/
│   └── analytics/
│       └── network_analytics.py
└── api/
    └── analytics.py
```

Dependencies:
- Analytics database
- Dashboard frontend

## Acceptance Criteria
- [ ] Network split calculated
- [ ] Template adoption tracked
- [ ] Usage distribution analyzed
- [ ] Dashboard displays charts
- [ ] Data queryable via API
- [ ] Weekly reports generated

## Dependencies
- TASK-M6-079: Telemetry Dashboard
- TASK-M6-080: Active Projects Tracking

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes
Month 6 analytics completion.

