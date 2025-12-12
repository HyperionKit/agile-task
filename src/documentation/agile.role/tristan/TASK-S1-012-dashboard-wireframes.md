# TASK-S1-012: Dashboard Wireframes

## Metadata
- Assignee: Tristan
- Role: CMFO/Frontend
- Sprint: 1
- Priority: P2
- Status: BACKLOG
- Due Date: 2025-12-22
- Estimated Hours: 8h
- Actual Hours: 

## Problem
Without wireframes:
- No shared vision for dashboard design
- Development starts without direction
- Multiple revisions during implementation
- Inconsistent user experience
- Missed edge cases

Current state: No design artifacts exist. Dashboard concept exists only in heads.

## Goal
Create wireframes for all dashboard screens covering the complete user flow from login to deployment. These wireframes:
- Define information hierarchy
- Establish component patterns
- Document all user flows
- Identify edge cases early

## Success Metrics
- All MVP screens wireframed
- User flow covers 100% of MVP features
- Component library defined
- Mobile layouts included
- Team approves designs before development

## Technical Scope

Files to create:
```
src/documentation/
├── design/
│   ├── wireframes/
│   │   ├── 01-dashboard-overview.png
│   │   ├── 02-new-build-prompt.png
│   │   ├── 03-build-progress.png
│   │   ├── 04-build-detail.png
│   │   ├── 05-build-history.png
│   │   ├── 06-user-profile.png
│   │   └── 07-mobile-views.png
│   ├── components/
│   │   └── component-library.md
│   └── flows/
│       └── user-flows.md
```

Dependencies:
- TASK-S1-007: Product Requirements Documentation

Integration points:
- Frontend development
- Component library
- User testing

## Minimal Code

```markdown
# Dashboard Wireframes Specification

## Screen 01: Dashboard Overview

### Layout
```
+--------------------------------------------------+
| Logo          [Search]      [Points: 150] [Avatar]|
+--------------------------------------------------+
|                                                   |
|  +------------+ +------------+ +------------+     |
|  | Builds     | | Success    | | Avg Time   |     |
|  | 24         | | 95%        | | 45s        |     |
|  +------------+ +------------+ +------------+     |
|                                                   |
|  +----------------------------------------------+ |
|  | [+ New Build]                                | |
|  +----------------------------------------------+ |
|                                                   |
|  Recent Builds                                    |
|  +----------------------------------------------+ |
|  | ERC-20 Token    | Mantle | Complete | 2m ago | |
|  | NFT Collection  | Solana | Deploying| 5m ago | |
|  | Staking Pool    | Mantle | Failed   | 1h ago | |
|  +----------------------------------------------+ |
|                                                   |
+--------------------------------------------------+
```

### Components
- MetricsCard: Shows single metric with label
- BuildRow: Build summary with status badge
- Button: Primary action (New Build)
- Avatar: User profile dropdown

### States
- Empty: "No builds yet. Create your first!"
- Loading: Skeleton placeholders
- Error: "Failed to load. Retry."

## Screen 02: New Build (Prompt)

### Layout
```
+--------------------------------------------------+
| <- Back                              New Build   |
+--------------------------------------------------+
|                                                   |
|  What do you want to build?                       |
|  +----------------------------------------------+ |
|  |                                              | |
|  | "Create ERC-20 token with 1M max supply,    | |
|  |  burnable, with owner minting"              | |
|  |                                              | |
|  +----------------------------------------------+ |
|  0/500 characters                                 |
|                                                   |
|  Or select a template:                            |
|  [ERC-20] [NFT] [DEX] [Staking] [Custom]         |
|                                                   |
|  Target Chain:                                    |
|  [v Mantle Testnet]                              |
|                                                   |
|  +----------------------------------------------+ |
|  |           [Generate Contract]                | |
|  +----------------------------------------------+ |
|                                                   |
+--------------------------------------------------+
```

### Components
- TextArea: Multi-line input with character count
- TemplateSelector: Horizontal scrollable chips
- ChainDropdown: Network selection
- Button: Primary action

### Validation
- Prompt required (min 10 characters)
- Chain required
- Show validation errors inline

## Screen 03: Build Progress

### Layout
```
+--------------------------------------------------+
| <- Cancel                        Build in Progress|
+--------------------------------------------------+
|                                                   |
|  [===========>                    ] 45%           |
|                                                   |
|  Current Step: Generating Code                    |
|                                                   |
|  +----------------------------------------------+ |
|  | [x] Analyzing prompt           2s            | |
|  | [x] Selecting model            1s            | |
|  | [>] Generating code            15s           | |
|  | [ ] Running audit                            | |
|  | [ ] Deploying contract                       | |
|  +----------------------------------------------+ |
|                                                   |
|  Estimated time remaining: 42 seconds             |
|                                                   |
+--------------------------------------------------+
```

### Components
- ProgressBar: Animated progress
- StepList: Checkmarks for complete, spinner for active
- TimeEstimate: Countdown

### States
- In progress: Show active step
- Failed: Show error at failed step
- Complete: Redirect to detail

## Screen 04: Build Detail

### Layout
```
+--------------------------------------------------+
| <- Back                              Build Detail |
+--------------------------------------------------+
|                                                   |
|  ERC-20 Token                    [Complete]       |
|  Mantle Testnet                                   |
|                                                   |
|  Contract Address:                                |
|  0x1234...5678  [Copy] [View on Explorer]        |
|                                                   |
|  Tabs: [Code] [Audit] [Deployment]               |
|  +----------------------------------------------+ |
|  | pragma solidity ^0.8.24;                     | |
|  |                                              | |
|  | import "@openzeppelin/...";                  | |
|  |                                              | |
|  | contract Token is ERC20 {                    | |
|  |   ...                                        | |
|  | }                                            | |
|  +----------------------------------------------+ |
|                                                   |
|  [Deploy to Another Chain]  [New Build]          |
|                                                   |
+--------------------------------------------------+
```

### Components
- StatusBadge: Complete/Failed/Pending
- AddressCopy: Address with copy button
- CodeViewer: Syntax highlighted code
- TabNavigation: Code/Audit/Deployment tabs
- AuditReport: Findings list with severity

## Screen 05: Build History

### Layout
```
+--------------------------------------------------+
| Logo          [Search]      [Points: 150] [Avatar]|
+--------------------------------------------------+
|                                                   |
|  Build History                    [Filter v]      |
|                                                   |
|  +----------------------------------------------+ |
|  | ERC-20 Token                                 | |
|  | Mantle | Complete | Dec 12 | 0x1234...      | |
|  +----------------------------------------------+ |
|  | NFT Collection                               | |
|  | Solana | Complete | Dec 11 | 7xAB...        | |
|  +----------------------------------------------+ |
|  | Staking Pool                                 | |
|  | Mantle | Failed   | Dec 10 | --             | |
|  +----------------------------------------------+ |
|                                                   |
|  [Load More]                                      |
|                                                   |
+--------------------------------------------------+
```

### Components
- BuildCard: Expanded build info
- FilterDropdown: Status, Chain, Date
- Pagination: Load more button

## Component Library

### Buttons
- Primary: Purple background, white text
- Secondary: Outline, purple border
- Ghost: Text only
- Sizes: sm, md, lg

### Cards
- MetricsCard: White bg, single metric
- BuildCard: Build summary row
- FeatureCard: Icon + title + description

### Form Elements
- Input: Single line text
- TextArea: Multi-line with counter
- Select: Dropdown with search
- Checkbox: With label

### Feedback
- StatusBadge: Complete (green), Failed (red), Pending (yellow)
- ProgressBar: Animated fill
- Spinner: Loading indicator
- Toast: Success/error notifications
```

## Acceptance Criteria
- [ ] Dashboard overview wireframe
- [ ] New build flow (3 screens)
- [ ] Build progress screen
- [ ] Build detail screen with tabs
- [ ] Build history with filters
- [ ] User profile screen
- [ ] Mobile layouts for all screens
- [ ] Component library documented
- [ ] User flow diagram
- [ ] Edge cases documented (empty, error, loading)
- [ ] Team approval before development

## Dependencies
- TASK-S1-007: Product Requirements Documentation

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes

