# TASK-M5-070: Waitlist & Invite System

## Metadata
- Assignee: Tristan
- Role: CMFO/Project Architect
- Month: 5 (February 2026)
- Priority: P1
- Status: BACKLOG
- Due Date: 2026-02-10
- Estimated Hours: 8h
- Actual Hours: 

## Problem
Public beta needs controlled access. Without waitlist:
- Cannot manage beta capacity
- No invite tracking
- Onboarding uncontrolled
- Cannot prioritize users

## Goal
Create waitlist and invite system for controlled public beta access through existing waitlist site and Discord as main funnel.

## Success Metrics
- Waitlist signup functional
- Invite code system working
- Discord integration
- User onboarding tracked
- 20-30 builders onboarded
- Invite tracking dashboard

## Technical Scope

Files to create/modify:
```
frontend/
├── app/
│   └── waitlist/
│       └── page.tsx
backend/
└── api/
    └── invites.py
```

Dependencies:
- Database for waitlist
- Invite code generation

## Acceptance Criteria
- [ ] Waitlist signup page
- [ ] Invite code system
- [ ] Discord integration
- [ ] Onboarding tracking
- [ ] Dashboard for invites
- [ ] Email notifications

## Dependencies
- TASK-M5-068: Public Beta Launch

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes
Month 5 beta infrastructure.

