# TASK-M6-082: HyperKit v1 Documentation & Scope

## Metadata
- Assignee: Justine
- Role: CPOO/Product Lead
- Month: 6 (March 2026)
- Priority: P0
- Status: BACKLOG
- Due Date: 2026-03-20
- Estimated Hours: 20h
- Actual Hours: 

## Problem
No clear definition of v1 scope. Without documentation:
- Users unsure what's supported
- Known limits not communicated
- Onboarding too slow
- No clear v2 roadmap

Current state: Scattered docs. No v1 announcement.

## Goal
Define and document HyperKit v1 scope for Metis and Hyperion. Create table of modules, versions, and known limits. Ensure new developers can go from zero to deployed in documentation.

## Success Metrics
- v1 scope table published
- Complete onboarding guide
- "Zero to deployed" in 15 minutes
- 20-30 active developers
- 5+ public case studies
- v2 roadmap defined

## Technical Scope

Deliverables:
```
docs/
├── v1/
│   ├── announcement.md
│   ├── scope-table.md
│   ├── supported-networks.md
│   ├── module-versions.md
│   └── known-limits.md
├── getting-started/
│   ├── quickstart.md
│   ├── first-deploy.md
│   └── troubleshooting.md
└── roadmap/
    └── v2-priorities.md
```

## Minimal Code

```markdown
# docs/v1/announcement.md

# HyperKit v1 for Metis & Hyperion

We're excited to announce HyperKit v1, the first stable release for building on Metis and Hyperion networks.

## What's Included

### AI-Powered Development
- Natural language contract generation
- Template-based deployment
- Automatic security scanning

### Supported Networks
| Network | Testnet | Mainnet |
|---------|---------|---------|
| Metis | ✅ Full | ✅ Conservative |
| Hyperion | ✅ Full | 🔜 Coming |

### Templates
- ERC-20 Tokens (basic, mintable, burnable)
- ERC-721 NFTs (with royalties)
- DeFi Vaults (ERC-4626)
- Staking Pools
- Simple Swaps

### Tools
- Dashboard (web UI)
- SDK (JavaScript/TypeScript)
- CLI (command line)

## What's NOT in v1
- Formal audits (internal review only)
- Full mainnet support for all templates
- Cross-chain bridging
- DAO templates
- Formal verification

## Getting Started
[Read the Quickstart Guide](./getting-started/quickstart.md)

## Known Limits
[View Known Limits](./known-limits.md)

## v2 Roadmap
[See What's Next](./roadmap/v2-priorities.md)
```

```markdown
# docs/v1/scope-table.md

# HyperKit v1 Scope

## Module Status Table

| Module | Version | Metis | Hyperion | Status |
|--------|---------|-------|----------|--------|
| **SDK** | 1.0.0 | ✅ | ✅ | Stable |
| **CLI** | 1.0.0 | ✅ | ✅ | Stable |
| **Dashboard** | 1.0.0 | ✅ | ✅ | Stable |
| **HyperAgent** | 1.0.0 | ✅ | ✅ | Stable |

## Template Status

| Template | Version | Testnet | Mainnet | Audit |
|----------|---------|---------|---------|-------|
| ERC-20 Basic | 1.0.0 | ✅ | ✅ | Internal |
| ERC-20 Mintable | 1.0.0 | ✅ | ⚠️ | Internal |
| ERC-20 Burnable | 1.0.0 | ✅ | ✅ | Internal |
| ERC-721 Basic | 1.0.0 | ✅ | ⚠️ | Internal |
| ERC-721 Royalty | 1.0.0 | ✅ | ⚠️ | Internal |
| Vault (ERC-4626) | 1.0.0 | ✅ | ❌ | Internal |
| Staking Pool | 1.0.0 | ✅ | ❌ | Internal |
| Simple Swap | 1.0.0 | ✅ | ❌ | Internal |

**Legend:**
- ✅ Full support
- ⚠️ Conservative (limited features)
- ❌ Not supported (testnet only)

## API Endpoints

| Endpoint | Version | Status |
|----------|---------|--------|
| POST /builds | v1 | Stable |
| GET /builds/{id} | v1 | Stable |
| GET /builds | v1 | Stable |
| DELETE /builds/{id} | v1 | Stable |
| GET /templates | v1 | Stable |
| POST /deploy | v1 | Stable |
| WS /builds/{id}/stream | v1 | Stable |

## Rate Limits

| Tier | Builds/Day | API Calls/Hour |
|------|------------|----------------|
| Free | 5 | 100 |
| Beta | 20 | 500 |
| Partner | 100 | 2000 |
| Enterprise | Unlimited | Custom |
```

```markdown
# docs/getting-started/quickstart.md

# HyperKit Quickstart

Deploy your first smart contract in 15 minutes or less.

## Prerequisites
- Wallet (MetaMask recommended)
- Testnet tokens (Metis Sepolia or Hyperion Testnet)

## Step 1: Sign Up (2 min)
1. Go to [dashboard.hyperkit.io](https://dashboard.hyperkit.io)
2. Connect your wallet
3. Sign the authentication message

## Step 2: Choose Template (2 min)
1. Click "New Build" → "Templates"
2. Select "ERC-20 Basic"
3. Choose "Metis Testnet"

## Step 3: Configure (3 min)
Fill in your token details:
- **Name:** My First Token
- **Symbol:** MFT
- **Initial Supply:** 1,000,000

## Step 4: Deploy (3 min)
1. Click "Review Deployment"
2. Check the safety report
3. Click "Deploy"
4. Confirm in your wallet

## Step 5: Verify (2 min)
1. Click "View on Explorer"
2. See your deployed contract
3. Import token to MetaMask

🎉 **Congratulations!** You've deployed your first contract!

## Next Steps
- [Deploy an NFT Collection](./first-nft.md)
- [Create a Vault](./first-vault.md)
- [Use the SDK](./sdk-guide.md)

## Troubleshooting
- [Common Issues](./troubleshooting.md)
- [Get Help on Discord](https://discord.gg/hyperkit)
```

```markdown
# docs/roadmap/v2-priorities.md

# HyperKit v2 Roadmap

Based on user feedback and usage data, here's what we're building next.

## Confirmed for v2

### 1. External Security Audit
- Engage third-party auditor
- Full audit of core templates
- Public audit report

### 2. Full Mainnet Support
- All templates on Metis mainnet
- Hyperion mainnet launch
- Production monitoring

### 3. Additional Networks
- Ethereum mainnet
- Polygon
- Arbitrum

### 4. Advanced Templates
- AMM/DEX
- Lending pools
- DAO governance
- Cross-chain bridges

## Considering for v2

Based on feedback (vote count):

| Feature | Votes | Priority |
|---------|-------|----------|
| Formal verification | 45 | High |
| Custom template builder | 38 | High |
| Team collaboration | 32 | Medium |
| API webhooks | 28 | Medium |
| Mobile app | 15 | Low |

## Timeline

| Milestone | Target |
|-----------|--------|
| Audit complete | Month 8 |
| Metis mainnet (all) | Month 9 |
| Hyperion mainnet | Month 10 |
| v2 templates | Month 11 |
| v2 release | Month 12 |

## How to Influence Roadmap

1. Vote on features: [feedback.hyperkit.io](https://feedback.hyperkit.io)
2. Join Discord: Share ideas in #feature-requests
3. GitHub: Open issues for specific needs

Your feedback shapes what we build!
```

## Acceptance Criteria
- [ ] v1 announcement published
- [ ] Scope table with all modules
- [ ] Network support documented
- [ ] Template status table
- [ ] Known limits clear
- [ ] Quickstart guide complete
- [ ] Zero to deployed in 15 minutes tested
- [ ] v2 roadmap defined
- [ ] 5+ case studies published
- [ ] Ecosystem report prepared
- [ ] Docs linked from dashboard
- [ ] Search functionality working

## Dependencies
- TASK-S7-043: Public Beta Launch
- TASK-S4-030: Documentation

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes
Month 6 Hyperion Milestone - v1 Launch

