# TASK-S6-042: Builder Office Hours

## Metadata
- Assignee: Tristan
- Role: CMFO/Frontend
- Sprint: 6 (Month 4)
- Priority: P1
- Status: BACKLOG
- Due Date: 2026-03-18
- Estimated Hours: 8h
- Actual Hours: 

## Problem
Builders struggle alone with deployment issues. Without office hours:
- Common issues repeatedly asked
- No live debugging support
- Security notes not communicated
- Community feels unsupported

Current state: Support only via Discord text. No live sessions.

## Goal
Host focused office hours for Metis and Hyperion builders. Walk through deploys, discuss security notes, debug 3+ real issues live.

## Success Metrics
- 1 office hours session held
- 10+ attendees
- 3+ issues debugged live
- Security notes presented
- Recording published

## Technical Scope

Session plan:
```
Duration: 60 minutes
Platform: Discord Stage / Twitter Spaces
Frequency: Bi-weekly (Month 4-6)

Agenda:
├── 0-10min: Intro + Security Notes
├── 10-30min: Live Deploy Walkthrough
├── 30-50min: Debug Real Issues
└── 50-60min: Q&A
```

Deliverables:
```
content/
├── office-hours/
│   ├── session-001-notes.md
│   ├── session-001-recording.mp4
│   └── common-issues.md
```

## Minimal Code

```markdown
# content/office-hours/session-001-notes.md

# Office Hours Session #1
**Date:** {{DATE}}
**Attendees:** {{COUNT}}
**Networks:** Metis, Hyperion

## Agenda Covered

### 1. Security Notes (10 min)
- Admin key best practices
- Trust assumptions in vault template
- Known limits document walkthrough

### 2. Live Deploy Demo (20 min)
- Deployed staking pool on Hyperion testnet
- Showed parameter configuration
- Demonstrated safety checks

### 3. Issues Debugged

#### Issue 1: Gas estimation failing on Metis
**Reporter:** {{USER}}
**Problem:** Deploy failing with "gas estimation failed"
**Root Cause:** RPC timeout on complex contract
**Solution:** Increased timeout, added retry logic
**Status:** Fixed in SDK v1.2.1

#### Issue 2: Template parameters not saving
**Reporter:** {{USER}}
**Problem:** Dashboard loses parameters on refresh
**Root Cause:** Local storage not persisting
**Solution:** Added proper state management
**Status:** Fixed in dashboard v1.0.3

#### Issue 3: Verification failing on Hyperion
**Reporter:** {{USER}}
**Problem:** Contract deployed but verification fails
**Root Cause:** Explorer API rate limiting
**Solution:** Added queue for verification requests
**Status:** In progress

### 4. Q&A Highlights
- Q: When will mainnet be supported?
  A: Targeting Month 5 for conservative flows
- Q: Can I customize the vault strategy?
  A: Yes, override _executeStrategy() in derived contract
- Q: How do I add my own template?
  A: Template contribution guide coming next week

## Action Items
- [ ] Fix Issue 3 by {{DATE}}
- [ ] Add template contribution guide
- [ ] Schedule next session for {{DATE}}

## Recording
[Watch on YouTube]({{RECORDING_LINK}})

## Next Session
- **Date:** {{NEXT_DATE}}
- **Topic:** Cross-chain deployment
- **Sign up:** {{SIGNUP_LINK}}
```

```markdown
# content/office-hours/common-issues.md

# Common Issues & Solutions

Collected from office hours and support channels.

## Deployment Issues

### Gas Estimation Failures
**Symptom:** "Failed to estimate gas"
**Cause:** Contract too complex or RPC timeout
**Solution:**
```javascript
// Increase timeout in SDK
const sdk = new HyperKit({
  rpcTimeout: 60000, // 60 seconds
  retries: 3
});
```

### Transaction Stuck Pending
**Symptom:** Deploy submitted but never confirms
**Cause:** Gas price too low
**Solution:**
```javascript
// Use gas price multiplier
const result = await sdk.deploy({
  gasPriceMultiplier: 1.2 // 20% above estimate
});
```

### Contract Verification Failing
**Symptom:** Contract deployed but not verified
**Cause:** Explorer API issues or source mismatch
**Solution:**
1. Wait 5 minutes and retry
2. Check source code matches exactly
3. Verify constructor args encoded correctly

## Dashboard Issues

### Parameters Not Saving
**Symptom:** Form resets on page refresh
**Solution:** Update to dashboard v1.0.3+

### Wallet Connection Failed
**Symptom:** Cannot connect MetaMask
**Solution:** 
1. Check network is supported
2. Clear browser cache
3. Disconnect/reconnect wallet

## Template Issues

### Vault Harvest Failing
**Symptom:** harvest() reverts
**Cause:** No yield to harvest or strategy error
**Solution:** Check underlying strategy implementation

### Staking Lock Not Enforced
**Symptom:** Can withdraw during lock period
**Cause:** Lock duration set to 0
**Solution:** Set lockDuration > 0 in constructor

## Network-Specific

### Metis: block.number Issues
**Symptom:** Time-based logic behaves unexpectedly
**Cause:** L2 block.number differs from L1
**Solution:** Use block.timestamp instead

### Hyperion: RPC Unreliable
**Symptom:** Intermittent connection failures
**Cause:** Network congestion or node issues
**Solution:** Use fallback RPC in SDK config
```

```typescript
// Office hours registration and reminder system
interface OfficeHoursSession {
  id: string;
  date: Date;
  topic: string;
  network: "metis" | "hyperion" | "all";
  signupLink: string;
  maxAttendees: number;
  registrations: string[];
}

const announceSession = async (session: OfficeHoursSession) => {
  // Discord announcement
  const discordMessage = `
# 🏗️ Builder Office Hours

**Topic:** ${session.topic}
**Date:** ${session.date.toLocaleDateString()}
**Time:** ${session.date.toLocaleTimeString()} UTC
**Network Focus:** ${session.network}

Join us for:
- Live deploy walkthrough
- Security notes review
- Debug your issues live
- Q&A with the team

**Sign up:** ${session.signupLink}

Limited to ${session.maxAttendees} spots!
`;

  // Post to Discord
  await postToDiscord(discordMessage);
  
  // Schedule reminder
  await scheduleReminder(session, "24h");
  await scheduleReminder(session, "1h");
};

const sendReminder = async (session: OfficeHoursSession, timing: string) => {
  const message = `
⏰ Reminder: Office Hours in ${timing}!

**Topic:** ${session.topic}
**Join here:** ${session.signupLink}

See you there! 🚀
`;
  
  // Send to registered users
  for (const userId of session.registrations) {
    await sendDM(userId, message);
  }
};
```

## Acceptance Criteria
- [ ] Session agenda created
- [ ] Discord Stage/Twitter Space set up
- [ ] Promotion posted (1 week before)
- [ ] Reminder sent (24h before)
- [ ] Session held successfully
- [ ] 10+ attendees
- [ ] 3+ issues debugged live
- [ ] Security notes presented
- [ ] Recording captured
- [ ] Notes published
- [ ] Common issues doc updated
- [ ] Next session scheduled

## Dependencies
- TASK-S6-040: Security Review (for notes)
- TASK-S5-036: Dashboard Template UI

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes
Month 4 Hyperion Milestone - Community Growth

