# TASK-S6-040: Internal Security Review

## Metadata
- Assignee: Aaron
- Role: CTO/Project Architect
- Sprint: 6 (Month 4)
- Priority: P0
- Status: BACKLOG
- Due Date: 2026-03-15
- Estimated Hours: 20h
- Actual Hours: 

## Problem
DeFi templates not security reviewed. Without review:
- Unknown vulnerabilities in production
- Trust assumptions unclear
- Admin risks undocumented
- Users at risk

Current state: Templates pass Slither but no manual review.

## Goal
Run internal security review of main DeFi templates. Document trust assumptions, admin risks, upgrade patterns. Publish "known limits" section in docs.

## Success Metrics
- All 3 DeFi templates reviewed
- Trust assumptions documented
- Admin risks cataloged
- Upgrade patterns assessed
- Known limits published
- Zero critical vulnerabilities in templates

## Technical Scope

Review scope:
```
Templates to review:
├── vault-metis/
├── staking-hyperion/
└── swap-multi/

Security checklist:
├── Access control
├── Reentrancy
├── Integer overflow (pre-0.8)
├── External calls
├── Oracle manipulation
├── Flash loan attacks
├── Upgrade safety
└── Admin key risks
```

Deliverables:
```
docs/security/
├── template-reviews/
│   ├── vault-metis-review.md
│   ├── staking-hyperion-review.md
│   └── swap-multi-review.md
├── trust-assumptions.md
├── admin-risks.md
└── known-limits.md
```

## Minimal Code

```markdown
# docs/security/template-reviews/vault-metis-review.md

# Security Review: Vault-Metis Template

**Reviewer:** {{REVIEWER}}
**Date:** {{DATE}}
**Template Version:** 1.0.0
**Severity Scale:** Critical / High / Medium / Low / Info

## Summary
| Category | Status |
|----------|--------|
| Access Control | ✅ Pass |
| Reentrancy | ✅ Pass |
| Integer Safety | ✅ Pass (Solidity 0.8+) |
| External Calls | ⚠️ Review Required |
| Admin Risks | ⚠️ Documented |

## Findings

### [M-1] Owner can set arbitrary fee recipient
**Severity:** Medium
**Location:** `Vault.sol:L45`

**Description:**
Owner can change fee recipient to any address without timelock.

**Impact:**
If owner key compromised, attacker could redirect all fees.

**Recommendation:**
Add timelock for fee recipient changes or restrict to known addresses.

**Status:** Documented in Known Limits

---

### [L-1] No maximum deposit cap
**Severity:** Low
**Location:** `Vault.sol`

**Description:**
No limit on total deposits which could create concentration risk.

**Impact:**
Single vault could hold majority of protocol TVL.

**Recommendation:**
Consider adding optional deposit cap parameter.

**Status:** Feature request for v2

## Trust Assumptions

1. **Owner is trusted** - Owner can:
   - Change fee recipient
   - Update performance fee (capped at 20%)
   - Pause/unpause deposits
   - Emergency withdraw

2. **Underlying asset is trusted** - Template assumes:
   - Asset is ERC20 compliant
   - No fee-on-transfer
   - No rebasing mechanics

3. **No external dependencies** - Vault does not:
   - Call external contracts
   - Use oracles
   - Depend on other protocols

## Admin Key Risks

| Action | Risk Level | Mitigation |
|--------|------------|------------|
| Change fee recipient | Medium | Use multisig |
| Update performance fee | Low | Capped at 20% |
| Emergency withdraw | High | Only use if exploited |
| Pause vault | Medium | Required for emergencies |

## Upgrade Patterns
- Template is **not upgradeable** by default
- No proxy pattern used
- Changes require new deployment

## Gas Analysis
| Function | Gas (avg) | Notes |
|----------|-----------|-------|
| deposit | 85,000 | ERC4626 compliant |
| withdraw | 95,000 | Includes share calculation |
| harvest | 150,000 | Strategy dependent |

## Recommendations Summary
1. Use multisig for owner
2. Consider deposit caps for v2
3. Add timelock for sensitive changes
4. Document fee structure clearly to users
```

```markdown
# docs/security/known-limits.md

# Known Limits

This document describes known limitations and trust assumptions for HyperKit templates. Read before deploying to production.

## General Limitations

### 1. Templates are not audited
Templates have undergone internal security review but **not external audit**. Use at your own risk on mainnet.

### 2. Owner privileges
All templates grant significant power to the owner address:
- Fee changes
- Pause functionality
- Emergency actions

**Recommendation:** Always use a multisig (e.g., Gnosis Safe) for owner.

### 3. No formal verification
Templates are tested but not formally verified. Edge cases may exist.

## Template-Specific Limits

### Vault-Metis
| Limitation | Impact | Mitigation |
|------------|--------|------------|
| No deposit cap | Concentration risk | Set manually or use v2 |
| Single owner | Centralization | Use multisig |
| No timelock | Fast admin changes | Add timelock wrapper |

### Staking-Hyperion
| Limitation | Impact | Mitigation |
|------------|--------|------------|
| Fixed lock duration | Inflexible | Deploy multiple pools |
| No slashing | No penalty for bad actors | Add slashing in v2 |
| Linear rewards | May not suit all use cases | Customize formula |

### Swap-Multi
| Limitation | Impact | Mitigation |
|------------|--------|------------|
| No oracle | Price manipulation risk | Use TWAP oracle |
| High slippage | Large trades affected | Set slippage limits |
| No MEV protection | Sandwich attacks | Use private mempool |

## Network-Specific Considerations

### Metis
- Block times vary (L2 batching)
- `block.number` may behave differently
- Gas prices generally lower

### Hyperion
- Network is newer, less battle-tested
- RPC reliability may vary
- Cross-chain features limited

## What We Do NOT Support
1. Fee-on-transfer tokens
2. Rebasing tokens
3. Tokens with callbacks (ERC-777)
4. Non-standard decimals without testing

## Reporting Issues
Found a vulnerability? Please report responsibly:
- Email: security@hyperkit.io
- Bug bounty: [link]
- Do not disclose publicly until fixed
```

```python
# scripts/security/run_review.py
"""
Automated security checks for templates
"""
import subprocess
import json
from pathlib import Path

TEMPLATES = [
    "packages/templates/defi/vault-metis",
    "packages/templates/defi/staking-hyperion",
    "packages/templates/defi/swap-multi",
]

def run_slither(template_path: str) -> dict:
    """Run Slither analysis"""
    result = subprocess.run(
        ["slither", template_path, "--json", "-"],
        capture_output=True,
        text=True
    )
    return json.loads(result.stdout)

def run_mythril(template_path: str) -> dict:
    """Run Mythril symbolic execution"""
    result = subprocess.run(
        ["myth", "analyze", f"{template_path}/*.sol", "-o", "json"],
        capture_output=True,
        text=True
    )
    return json.loads(result.stdout)

def check_admin_functions(source: str) -> list:
    """Find admin-controlled functions"""
    admin_patterns = [
        "onlyOwner",
        "onlyAdmin",
        "onlyRole",
        "require(msg.sender ==",
    ]
    findings = []
    for i, line in enumerate(source.split("\n")):
        for pattern in admin_patterns:
            if pattern in line:
                findings.append({
                    "line": i + 1,
                    "pattern": pattern,
                    "code": line.strip()
                })
    return findings

def generate_report(template: str, slither: dict, admin: list) -> str:
    """Generate markdown review report"""
    # Implementation
    pass

if __name__ == "__main__":
    for template in TEMPLATES:
        print(f"Reviewing {template}...")
        slither_results = run_slither(template)
        admin_functions = check_admin_functions(
            Path(template).glob("*.sol")
        )
        report = generate_report(template, slither_results, admin_functions)
        
        output_path = f"docs/security/template-reviews/{Path(template).name}-review.md"
        Path(output_path).write_text(report)
        print(f"Report saved to {output_path}")
```

## Acceptance Criteria
- [ ] Vault-Metis review completed
- [ ] Staking-Hyperion review completed
- [ ] Swap-Multi review completed
- [ ] Trust assumptions documented
- [ ] Admin risks cataloged
- [ ] Known limits published
- [ ] No critical vulnerabilities found
- [ ] Medium issues documented
- [ ] Automated review script working
- [ ] Security docs linked from main docs
- [ ] Review process documented for future templates

## Dependencies
- TASK-S5-033: DeFi Templates
- TASK-S2-016: Slither Integration

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes
Month 4 Hyperion Milestone - Security

