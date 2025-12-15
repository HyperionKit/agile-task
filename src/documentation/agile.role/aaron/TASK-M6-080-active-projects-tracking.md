# TASK-M6-080: Active Projects Tracking

## Metadata
- Assignee: Aaron
- Role: CTO/Project Architect
- Month: 6 (March 2026)
- Priority: P1
- Status: BACKLOG
- Due Date: 2026-03-20
- Estimated Hours: 8h
- Actual Hours: 

## Problem
No tracking of active projects. Without tracking:
- Cannot measure adoption
- Project count unknown
- Usage patterns unclear
- No data for reporting

## Goal
Add telemetry to track active projects, number of deployments, and usage patterns for Metis and Hyperion.

## Success Metrics
- Active projects tracked
- Deployment counts accurate
- Usage patterns visible
- Data queryable
- Dashboard operational

## Technical Scope

Files to create/modify:
```
backend/
├── services/
│   └── telemetry/
│       └── project_tracker.py
└── api/
    └── analytics.py
```

Dependencies:
- Database
- Analytics service

## Acceptance Criteria
- [ ] Project tracking implemented
- [ ] Active project count accurate
- [ ] Deployment counts tracked
- [ ] Usage patterns analyzed
- [ ] API endpoint functional
- [ ] Dashboard displays data

## Dependencies
- TASK-M6-079: Telemetry Dashboard

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes
Month 6 analytics.

