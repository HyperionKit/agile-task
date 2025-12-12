# TASK-S8-045: Builder Spotlight Series

## Metadata
- Assignee: Tristan
- Role: CMFO/Frontend
- Sprint: 8 (Month 6)
- Priority: P1
- Status: BACKLOG
- Due Date: 2026-05-10
- Estimated Hours: 12h
- Actual Hours: 

## Problem
Successful builders not being highlighted. Without spotlights:
- No social proof
- Community feels invisible
- No content for Metis reports
- Missing engagement opportunities

Current state: Case studies exist but not promoted.

## Goal
Launch recurring "Builder Spotlight" featuring Metis and Hyperion projects using HyperKit. Publish 2-3 episodes by end of Month 6.

## Success Metrics
- 3 spotlight episodes published
- Projects featured with their permission
- GitHub/on-chain references included
- Content suitable for Metis blog
- 50+ engagements per episode

## Technical Scope

Content format:
```
content/
├── spotlights/
│   ├── episode-001-{{project}}.md
│   ├── episode-002-{{project}}.md
│   └── episode-003-{{project}}.md
└── templates/
    └── spotlight-template.md
```

Distribution:
- Blog post
- Twitter thread
- Discord announcement
- CEG Forum
- YouTube/Loom video (optional)

## Minimal Code

```markdown
# content/templates/spotlight-template.md

# Builder Spotlight: {{PROJECT_NAME}}

## Quick Facts
- **Project:** {{PROJECT_NAME}}
- **Network:** {{NETWORK}}
- **Category:** {{CATEGORY}}
- **Templates Used:** {{TEMPLATES}}
- **Deploy Date:** {{DATE}}

## The Team
{{TEAM_DESCRIPTION}}

[Twitter]({{TWITTER}}) | [GitHub]({{GITHUB}}) | [Website]({{WEBSITE}})

## What They Built
{{PROJECT_DESCRIPTION}}

### The Challenge
{{CHALLENGE_DESCRIPTION}}

### The Solution
{{SOLUTION_DESCRIPTION}}

## HyperKit Integration

### How They Used HyperKit
{{INTEGRATION_STORY}}

### Templates Deployed
| Contract | Template | Network | Address |
|----------|----------|---------|---------|
| {{CONTRACT_1}} | {{TEMPLATE_1}} | {{NETWORK}} | [{{ADDRESS_1}}]({{EXPLORER_1}}) |

### Results
- **Deploy Time:** {{DEPLOY_TIME}}
- **Gas Saved:** {{GAS_SAVED}}
- **Time Saved:** {{TIME_SAVED}}

## In Their Words
> "{{TESTIMONIAL}}"
> — {{PERSON}}, {{ROLE}}

## Technical Highlights
{{TECHNICAL_HIGHLIGHTS}}

## What's Next for {{PROJECT_NAME}}
{{FUTURE_PLANS}}

## Try It Yourself
Want to build something similar?
1. [Use the {{TEMPLATE}} template]({{TEMPLATE_LINK}})
2. [Read the docs]({{DOCS_LINK}})
3. [Join our Discord]({{DISCORD_LINK}})

---

*Builder Spotlight is a series featuring projects building on Metis and Hyperion with HyperKit. Want to be featured? [Apply here]({{APPLICATION_LINK}}).*
```

```markdown
# content/spotlights/episode-001-example.md

# Builder Spotlight #1: MetisVault

## Quick Facts
- **Project:** MetisVault
- **Network:** Metis
- **Category:** DeFi / Yield
- **Templates Used:** Vault-Metis, ERC-20
- **Deploy Date:** March 2026

## The Team
MetisVault is built by a team of three DeFi enthusiasts based in Singapore. They've been building on Metis since the network launched.

[Twitter](https://twitter.com/metisvault) | [GitHub](https://github.com/metisvault)

## What They Built
MetisVault is a yield aggregator that auto-compounds rewards across Metis DeFi protocols. Users deposit assets and receive vault shares that grow over time.

### The Challenge
Building a secure vault from scratch would have taken 3-4 weeks of development plus another 2 weeks for testing. As a small team, they needed to move faster without compromising security.

### The Solution
Using HyperKit's Vault-Metis template, they deployed their first vault in an afternoon. The template came with:
- ERC-4626 compliance
- Configurable fees
- Owner controls
- Gas optimizations for Metis L2

## HyperKit Integration

### How They Used HyperKit
"We tried HyperKit on a whim. Typed 'create USDC vault on Metis with 10% performance fee' and 90 seconds later had a working contract. We spent the next week customizing the strategy, not the vault itself."

### Templates Deployed
| Contract | Template | Network | Address |
|----------|----------|---------|---------|
| USDCVault | Vault-Metis | Metis Testnet | [0x1234...](https://explorer.metis.io/address/0x1234) |
| VaultToken | ERC-20 | Metis Testnet | [0x5678...](https://explorer.metis.io/address/0x5678) |

### Results
- **Deploy Time:** 87 seconds
- **Development Saved:** ~3 weeks
- **Gas Cost:** 0.02 METIS

## In Their Words
> "HyperKit changed how we think about smart contract development. We went from 'build everything custom' to 'customize only what's unique'. The templates are production-ready and the safety checks caught a parameter mistake before we deployed."
> — Alex Chen, Lead Developer

## Technical Highlights
- Used HyperAgent prompt to configure vault
- Customized harvest strategy by extending base contract
- Integrated with existing Metis DeFi protocols
- Dashboard for user deposits/withdrawals built in 2 days

## What's Next for MetisVault
- Mainnet launch planned for April
- Additional vault strategies (ETH, USDT)
- Integration with lending protocols
- Governance token launch

## Try It Yourself
Want to build a vault on Metis?
1. [Use the Vault-Metis template](https://hyperkit.io/templates/vault-metis)
2. [Read the vault docs](https://docs.hyperkit.io/templates/vault)
3. [Join our Discord](https://discord.gg/hyperkit)

---

*Builder Spotlight is a series featuring projects building on Metis and Hyperion with HyperKit. Want to be featured? [Apply here](https://hyperkit.io/spotlight-apply).*
```

```typescript
// Spotlight promotion automation
const promoteSpotlight = async (spotlight: SpotlightEpisode) => {
  // Generate Twitter thread
  const tweets = [
    `🔦 Builder Spotlight: ${spotlight.projectName}

Meet the team building ${spotlight.category} on ${spotlight.network} with HyperKit.

Here's their story 🧵`,
    
    `The Challenge:
${spotlight.challenge.slice(0, 200)}...`,
    
    `The Solution:
Used HyperKit ${spotlight.templates.join(", ")} templates
⏱️ Deploy time: ${spotlight.deployTime}
💰 Saved: ${spotlight.timeSaved} of development`,
    
    `"${spotlight.testimonial.slice(0, 200)}..."
— ${spotlight.person}, ${spotlight.role}`,
    
    `What they built:
${spotlight.description.slice(0, 200)}...

🔗 ${spotlight.website}`,
    
    `Want to be featured in Builder Spotlight?

1. Build on Metis or Hyperion
2. Use HyperKit templates
3. Apply: ${spotlight.applicationLink}

Full story: ${spotlight.blogLink}`,
  ];
  
  // Post to Twitter
  await postTwitterThread(tweets);
  
  // Post to Discord
  await postDiscordAnnouncement({
    title: `🔦 Builder Spotlight: ${spotlight.projectName}`,
    description: spotlight.description,
    link: spotlight.blogLink,
  });
  
  // Post to CEG Forum
  await postForumThread({
    category: "Ecosystem",
    title: `Builder Spotlight: ${spotlight.projectName} on ${spotlight.network}`,
    content: spotlight.fullContent,
  });
};
```

## Acceptance Criteria
- [ ] Spotlight template created
- [ ] 3 projects identified and approved
- [ ] Episode 1 written and published
- [ ] Episode 2 written and published
- [ ] Episode 3 written and published
- [ ] Twitter threads posted
- [ ] Discord announcements posted
- [ ] CEG Forum posts published
- [ ] 50+ engagements per episode
- [ ] Projects have given permission
- [ ] On-chain references included
- [ ] Content ready for Metis blog
- [ ] Application form for future spotlights

## Dependencies
- TASK-S5-037: Pilot Projects
- TASK-S6-041: Partner Playbook

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes
Month 6 Hyperion Milestone - Community Growth

