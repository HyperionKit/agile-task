# TASK-M1-019: Brand Messaging & Copy

## Metadata
- Assignee: Tristan
- Role: CMFO/Frontend
- Month: 1 (October 2025)
- Priority: P2
- Status: DONE
- Due Date: 2025-10-07
- Completed Date: 2025-10-07
- Estimated Hours: 6h
- Actual Hours: 

## Problem
Without consistent brand messaging:
- Each touchpoint sounds different
- No memorable tagline
- Unclear value proposition
- Marketing materials inconsistent
- Error messages confuse users

Current state: No brand guidelines exist. Ad-hoc copy creation.

## Goal
Develop brand voice guidelines and create copy for all HyperKit touchpoints. This ensures:
- Consistent voice across all channels
- Memorable, repeatable messaging
- Clear value proposition
- Professional user experience

## Success Metrics
- Brand voice guide complete
- Tagline tested with 5 potential users
- All landing page copy written
- Error messages documented
- Email templates created
- Team uses guidelines consistently

## Technical Scope

Files to create:
```
src/documentation/
├── brand/
│   ├── voice-guidelines.md
│   ├── taglines.md
│   ├── copy/
│   │   ├── landing-page.md
│   │   ├── dashboard.md
│   │   ├── errors.md
│   │   └── emails.md
│   └── social/
│       ├── twitter-bio.md
│       └── templates.md
```

Dependencies:
- None

Integration points:
- Landing page
- Dashboard UI
- Email system
- Social media

## Minimal Code

```markdown
# Brand Voice Guidelines

## Voice Attributes

### Professional
- Technical accuracy matters
- No hype or exaggeration
- Data-backed claims only

### Direct
- Short sentences preferred
- Active voice always
- No filler words

### Helpful
- Assume good intent
- Guide, do not lecture
- Celebrate user wins

### Developer-Focused
- Respect technical knowledge
- Skip obvious explanations
- Use industry terminology correctly

## Tone by Context

| Context | Tone | Example |
|---------|------|---------|
| Marketing | Confident, exciting | "Build dApps in 87 seconds" |
| Documentation | Clear, instructive | "Connect your wallet to begin" |
| Errors | Helpful, solution-focused | "Transaction failed. Check gas limit." |
| Success | Celebratory, brief | "Contract deployed!" |

## Words to Avoid
- Revolutionary, game-changing, disruptive
- Leverage, utilize, synergy
- Basically, actually, really
- Simple, easy (unless proven)
- Best, leading, top (unverified claims)

## Words to Use
- Build, create, deploy
- Fast, quick, instant
- Secure, audited, verified
- Earn, contribute, grow
```

```markdown
# Taglines

## Primary Tagline
"Build dApps in 87 seconds"

Rationale: Specific number (87) is memorable and believable.
Tested against: "Build dApps fast" (too generic)

## Secondary Taglines
- "One SDK, 100+ chains"
- "AI-powered, human-audited"
- "From prompt to production"
- "Earn while you build"

## Value Proposition (One Sentence)
HyperKit is an AI-native platform that lets developers build, audit, and deploy smart contracts to 100+ chains in under 2 minutes.

## Elevator Pitch (30 Seconds)
"HyperKit turns natural language into production-ready smart contracts. Describe what you want to build, and our AI generates the code, audits it for security, and deploys it to your chosen blockchain. What used to take months now takes minutes. Plus, you earn tokens for every contribution."
```

```markdown
# Error Messages

## Principles
1. Say what happened
2. Say why (if known)
3. Say what to do next

## Examples

### Wallet Connection
Bad: "Error connecting wallet"
Good: "Wallet connection failed. Make sure MetaMask is unlocked and try again."

### Build Failed
Bad: "Build error"
Good: "Build failed: Invalid Solidity syntax on line 42. Check for missing semicolon."

### Rate Limited
Bad: "Too many requests"
Good: "Rate limit reached. Try again in 60 seconds or upgrade to Premium."

### Deployment Failed
Bad: "Transaction failed"
Good: "Deployment failed: Insufficient gas. Increase gas limit and retry."

## Error Code Format
```
[AREA]-[CODE]: [Message]

Examples:
AUTH-001: Session expired. Please reconnect wallet.
BUILD-042: Template not found. Select a valid template.
DEPLOY-101: Network congestion. Transaction pending.
```
```

```markdown
# Email Templates

## Welcome Email
Subject: Welcome to HyperKit

Hi {name},

Thanks for signing up.

HyperKit helps you build smart contracts fast. Here is how to start:

1. Connect your wallet
2. Enter a prompt like "Create ERC-20 token with 1M supply"
3. Review the generated code
4. Deploy to testnet

Questions? Reply to this email.

Build something great,
The HyperKit Team

## First Build Complete
Subject: Your first contract is live

Congrats! Your contract is deployed.

Contract: {contract_address}
Chain: {chain_name}
Explorer: {explorer_link}

What is next?
- View your contract on the explorer
- Deploy to another chain
- Create a new build

Keep building,
The HyperKit Team
```

## Acceptance Criteria
- [ ] Brand voice guidelines document complete
- [ ] Primary tagline finalized
- [ ] Secondary taglines (5 options)
- [ ] Value proposition (one sentence)
- [ ] Elevator pitch (30 seconds)
- [ ] Landing page copy complete
- [ ] Dashboard UI copy complete
- [ ] Error message guidelines
- [ ] 10 error message examples
- [ ] Welcome email template
- [ ] Transaction complete email template
- [ ] Twitter bio written
- [ ] Social post templates (3)

## Dependencies
- TASK-S1-007: Product Requirements Documentation

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes

