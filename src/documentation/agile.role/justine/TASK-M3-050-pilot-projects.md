# TASK-M3-050: Pilot Projects (Metis & Hyperion)

## Metadata
- Assignee: Justine
- Role: CPOO/Product Lead
- Month: 3 (December 2025)
- Priority: P1
- Status: BACKLOG
- Due Date: 2025-12-20
- Estimated Hours: 16h
- Actual Hours: 

## Problem
No real projects using HyperKit on Metis/Hyperion networks. Without pilots:
- Cannot validate template usefulness
- No case studies for ecosystem
- Missing real-world feedback
- No proof of platform viability

Current state: Internal testing only. No external project usage.

## Goal
Secure 1 pilot project on Metis and 1 pilot project on Hyperion using templates on testnet. Produce case study from each.

## Success Metrics
- 1 pilot project on Metis testnet
- 1 pilot project on Hyperion testnet
- Case studies written (problem, template, outcome)
- Blockers documented and resolved
- Pilots commit to continued usage

## Technical Scope

Pilot project criteria:
```
1. Active development team
2. Building DeFi or token project
3. Willing to use testnet
4. Can provide feedback within 2 weeks
5. Allows public case study
```

Deliverables:
```
docs/
├── pilots/
│   ├── metis-pilot-001.md
│   ├── hyperion-pilot-001.md
│   └── case-study-template.md
```

## Minimal Code

```markdown
# docs/pilots/case-study-template.md

# Case Study: {{PROJECT_NAME}}

## Project Overview
- **Project**: {{PROJECT_NAME}}
- **Network**: {{NETWORK}}
- **Template Used**: {{TEMPLATE}}
- **Deployment Date**: {{DATE}}
- **Status**: {{STATUS}}

## Problem Statement
What problem was the project trying to solve?
{{PROBLEM_DESCRIPTION}}

## Solution with HyperKit
### Template Selection
- Template chosen: {{TEMPLATE_NAME}}
- Why this template: {{SELECTION_REASON}}

### Configuration
```json
{
  // Template parameters used
}
```

### Deployment Process
1. Connected to HyperKit dashboard
2. Selected {{TEMPLATE}} template
3. Configured parameters
4. Deployed to {{NETWORK}} testnet
5. Verified contract on explorer

## Results
- **Deployment Time**: {{TIME}} (target: <90 seconds)
- **Gas Cost**: {{GAS_COST}}
- **Contract Address**: {{CONTRACT_ADDRESS}}
- **Explorer Link**: {{EXPLORER_URL}}

## Blockers Encountered
| Issue | Resolution | Time to Fix |
|-------|------------|-------------|
| {{ISSUE_1}} | {{RESOLUTION_1}} | {{TIME_1}} |

## Feedback
### What Worked Well
- {{POSITIVE_1}}
- {{POSITIVE_2}}

### Areas for Improvement
- {{IMPROVEMENT_1}}
- {{IMPROVEMENT_2}}

## Metrics
- Build success rate: {{SUCCESS_RATE}}%
- User satisfaction: {{SATISFACTION}}/5
- Would recommend: {{RECOMMEND}}

## Next Steps
- [ ] Mainnet deployment planned
- [ ] Additional features requested
- [ ] Integration with {{OTHER_TOOLS}}

## Contact
- **Project Lead**: {{CONTACT_NAME}}
- **GitHub**: {{GITHUB_URL}}
- **Discord**: {{DISCORD}}
```

```markdown
# docs/pilots/metis-pilot-001.md

# Metis Pilot: {{PROJECT_NAME}}

## Overview
First pilot project on Metis using HyperKit DeFi templates.

## Project Details
- **Team**: {{TEAM_NAME}}
- **Product**: {{PRODUCT_DESCRIPTION}}
- **Stage**: Testnet
- **Template**: Vault-Metis

## Timeline
| Week | Milestone |
|------|-----------|
| 1 | Initial meeting, requirements gathering |
| 2 | Template deployment, configuration |
| 3 | Testing, feedback collection |
| 4 | Case study publication |

## Integration Points
- Using HyperKit SDK v{{VERSION}}
- Dashboard deployment flow
- Metis testnet (Chain ID: 59901)

## Success Criteria
- [ ] Contract deployed successfully
- [ ] All template features working
- [ ] Team satisfied with workflow
- [ ] Case study approved for publication

## Repository
- **HyperKit Build**: {{BUILD_ID}}
- **Contract**: {{CONTRACT_ADDRESS}}
- **Project Repo**: {{REPO_URL}}
```

```typescript
// Pilot outreach email template
const PILOT_OUTREACH = `
Subject: Partner with HyperKit - Deploy on {{NETWORK}} in Minutes

Hi {{NAME}},

I noticed {{PROJECT}} is building on {{NETWORK}}. We're looking for pilot partners to test our new DeFi templates.

**What we offer:**
- Free access to HyperKit platform
- DeFi templates (vault, staking, swap) optimized for {{NETWORK}}
- Direct support from our engineering team
- Featured case study in our ecosystem report

**What we ask:**
- Deploy one template on testnet
- Share feedback (30 min call)
- Allow us to publish case study

**Timeline:** 2-3 weeks from start to case study

Interested? Reply or book time: {{CALENDAR_LINK}}

Best,
{{SENDER_NAME}}
HyperKit Team
`;
```

## Acceptance Criteria
- [ ] Pilot criteria defined
- [ ] Outreach list of 10+ projects per network
- [ ] Outreach emails sent
- [ ] 1 Metis pilot secured
- [ ] 1 Hyperion pilot secured
- [ ] Pilots complete deployment
- [ ] Blockers documented in tracker
- [ ] Case studies written
- [ ] Case studies approved by pilots
- [ ] Internal retrospective completed
- [ ] Learnings fed back to product team

## Dependencies
- TASK-S5-033: DeFi Templates
- TASK-S5-036: Dashboard Template UI

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes
Month 3 Hyperion Milestone - Pilot Projects
Business Goal: Validate templates with real projects

