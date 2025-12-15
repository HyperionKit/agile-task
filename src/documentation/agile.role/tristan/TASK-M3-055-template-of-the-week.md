# TASK-M3-055: Template of the Week Series

## Metadata
- Assignee: Tristan
- Role: CMFO/Frontend
- Month: 3 (December 2025)
- Priority: P2
- Status: BACKLOG
- Due Date: 2025-12-20
- Estimated Hours: 8h
- Actual Hours: 

## Problem
Templates exist but developers don't know about them. Without promotion:
- Low template adoption
- Developers unaware of capabilities
- No community engagement around templates
- Missing educational content

Current state: Templates documented but not promoted.

## Goal
Launch "Template of the Week" series focused on Metis and Hyperion. Show template, code link, and HyperKit/HyperAgent integration.

## Success Metrics
- 4 template posts published (one per week)
- 15+ feature requests/bug reports collected
- 50+ social engagements per post
- Community requests tracked in backlog

## Technical Scope

Content to create:
```
content/
├── template-of-the-week/
│   ├── week-1-vault-metis.md
│   ├── week-2-staking-hyperion.md
│   ├── week-3-swap-multi.md
│   └── week-4-token-erc20.md
```

Distribution channels:
- Twitter/X thread
- Discord announcement
- CEG Forum post
- GitHub discussions

## Minimal Code

```markdown
# content/template-of-the-week/week-1-vault-metis.md

# Template of the Week: Metis Vault

Deploy a yield vault on Metis in under 2 minutes.

## What It Does
The Vault-Metis template creates an ERC-4626 compliant yield vault optimized for Metis L2. Perfect for:
- Yield aggregators
- Treasury management
- DeFi protocols

## Quick Start

### Using Dashboard
1. Go to [hyperkit.io/templates](https://hyperkit.io/templates)
2. Select "Vault-Metis"
3. Pick Metis Testnet
4. Set your parameters
5. Deploy

### Using HyperAgent
Just say:
```
"Create a USDC vault on Metis with 5% performance fee"
```

HyperAgent handles the rest.

## Code Preview

```solidity
contract MetisVault is ERC4626, Ownable {
    uint256 public performanceFee;
    
    function harvest() external {
        // Yield collection logic
    }
}
```

[Full code on GitHub]({{GITHUB_LINK}})

## Key Features
- ERC-4626 compliant
- Performance fee support
- Owner-controlled harvest
- Metis gas optimized

## Try It
- [Deploy Now](https://hyperkit.io/templates/vault-metis)
- [View Docs](https://docs.hyperkit.io/templates/vault)
- [Ask Questions](https://discord.gg/hyperkit)

## Feedback?
Found a bug? Want a feature? Let us know:
- [GitHub Issues]({{ISSUES_LINK}})
- [Discord #feedback]({{DISCORD_LINK}})

---
Tags: #metis #defi #vault #erc4626
```

```typescript
// Social media post generator
const generateTwitterThread = (template: TemplatePost) => {
  return [
    // Tweet 1: Hook
    `🏗️ Template of the Week: ${template.name}

Deploy a ${template.type} on ${template.network} in under 2 minutes.

Here's how 👇`,
    
    // Tweet 2: Problem
    `Building ${template.type}s from scratch?

❌ Takes days to write
❌ Security risks
❌ Gas optimization headaches

HyperKit templates solve this.`,
    
    // Tweet 3: Solution
    `With HyperKit ${template.name}:

✅ Production-ready code
✅ ${template.network} optimized
✅ One-click deploy
✅ Security audited patterns`,
    
    // Tweet 4: How to use
    `How to deploy:

1️⃣ Visit hyperkit.io/templates
2️⃣ Select "${template.name}"
3️⃣ Choose ${template.network}
4️⃣ Set parameters
5️⃣ Deploy

Or just tell HyperAgent:
"${template.prompt}"`,
    
    // Tweet 5: CTA
    `Try it now:
🔗 ${template.dashboardLink}

Code:
🔗 ${template.githubLink}

Questions? Join our Discord:
🔗 ${template.discordLink}

#${template.network} #DeFi #Web3`,
  ];
};
```

```markdown
# Discord Announcement Template

## 🏗️ Template of the Week: {{TEMPLATE_NAME}}

Hey builders! 

This week we're featuring **{{TEMPLATE_NAME}}** - deploy a {{TEMPLATE_TYPE}} on {{NETWORK}} in minutes.

### What's included:
- {{FEATURE_1}}
- {{FEATURE_2}}
- {{FEATURE_3}}

### Quick deploy:
1. Go to <{{DASHBOARD_LINK}}>
2. Select "{{TEMPLATE_NAME}}"
3. Configure & deploy

### Or use HyperAgent:
```
{{SAMPLE_PROMPT}}
```

### Links:
- 📚 Docs: {{DOCS_LINK}}
- 💻 Code: {{GITHUB_LINK}}
- 🐛 Issues: {{ISSUES_LINK}}

### Feedback wanted!
What templates do you want next? React below:
- 🔄 AMM/DEX
- 🌾 Yield Farm
- 🏛️ DAO
- 📊 Other (comment)

---
@everyone
```

## Acceptance Criteria
- [ ] Week 1 post: Vault-Metis
- [ ] Week 2 post: Staking-Hyperion
- [ ] Week 3 post: Swap-Multi
- [ ] Week 4 post: Token-ERC20
- [ ] Twitter threads created
- [ ] Discord announcements posted
- [ ] CEG Forum posts published
- [ ] 15+ feedback items collected
- [ ] Feedback tagged by network
- [ ] Backlog updated with requests
- [ ] Engagement metrics tracked
- [ ] Content calendar maintained

## Dependencies
- TASK-S5-033: DeFi Templates
- TASK-S1-011: Brand Messaging

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes
Month 3 Hyperion Milestone - Community Growth
Goal: Collect 15+ feature requests/bug reports

