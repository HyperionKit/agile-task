# TASK-S5-035: Deployment Safety Checks

## Metadata
- Assignee: Aaron
- Role: CTO/Project Architect
- Sprint: 5 (Month 3)
- Priority: P1
- Status: BACKLOG
- Due Date: 2026-02-22
- Estimated Hours: 10h
- Actual Hours: 

## Problem
Users can deploy contracts with risky configurations. Without safety checks:
- Admin set to EOA instead of multisig
- Upgradeability enabled without timelock
- Fees set to exploitative levels
- No warning before irreversible deployments

Current state: Deploy button always active. No pre-deployment validation.

## Goal
Add deployment safety checks for Metis and Hyperion that warn users before deploying contracts with risky configurations.

## Success Metrics
- 5+ safety check rules implemented
- Warnings displayed before deployment
- Deploy blocked for critical issues
- Override option for advanced users
- Zero accidental risky deployments

## Technical Scope

Files to create:
```
backend/hyperagent/
├── safety/
│   ├── __init__.py
│   ├── checker.py
│   ├── rules/
│   │   ├── admin_checks.py
│   │   ├── fee_checks.py
│   │   ├── upgradeability_checks.py
│   │   └── network_checks.py
│   └── reporter.py
└── tests/
    └── test_safety.py
```

Dependencies:
- Slither for static analysis
- Contract ABI parser

## Minimal Code

```python
# backend/hyperagent/safety/checker.py
from dataclasses import dataclass
from enum import Enum
from typing import List, Optional
import re

class Severity(Enum):
    CRITICAL = "critical"  # Block deployment
    HIGH = "high"          # Strong warning
    MEDIUM = "medium"      # Warning
    LOW = "low"            # Info
    
@dataclass
class SafetyIssue:
    severity: Severity
    rule_id: str
    title: str
    description: str
    recommendation: str
    can_override: bool = True

@dataclass
class SafetyReport:
    passed: bool
    issues: List[SafetyIssue]
    warnings_count: int
    critical_count: int

class SafetyChecker:
    """
    Pre-deployment safety checker for smart contracts.
    Validates configuration before deployment.
    """
    
    def __init__(self):
        self.rules = self._load_rules()
    
    def _load_rules(self) -> List['SafetyRule']:
        """Load all safety rules"""
        return [
            AdminEOARule(),
            HighFeeRule(),
            UpgradeabilityRule(),
            ZeroAddressRule(),
            MetisSpecificRule(),
            HyperionSpecificRule(),
        ]
    
    async def check(
        self,
        code: str,
        params: dict,
        network: str
    ) -> SafetyReport:
        """Run all safety checks"""
        
        issues = []
        
        for rule in self.rules:
            if rule.applies_to_network(network):
                issue = await rule.check(code, params, network)
                if issue:
                    issues.append(issue)
        
        critical_count = sum(1 for i in issues if i.severity == Severity.CRITICAL)
        warnings_count = sum(1 for i in issues if i.severity in [Severity.HIGH, Severity.MEDIUM])
        
        return SafetyReport(
            passed=critical_count == 0,
            issues=issues,
            warnings_count=warnings_count,
            critical_count=critical_count
        )


class SafetyRule:
    """Base class for safety rules"""
    
    rule_id: str
    networks: List[str] = []  # Empty = all networks
    
    def applies_to_network(self, network: str) -> bool:
        if not self.networks:
            return True
        return network.lower() in [n.lower() for n in self.networks]
    
    async def check(
        self,
        code: str,
        params: dict,
        network: str
    ) -> Optional[SafetyIssue]:
        raise NotImplementedError


# backend/hyperagent/safety/rules/admin_checks.py
class AdminEOARule(SafetyRule):
    """Check if admin is an EOA instead of multisig/contract"""
    
    rule_id = "ADMIN_EOA"
    
    async def check(self, code: str, params: dict, network: str) -> Optional[SafetyIssue]:
        admin_address = params.get("admin") or params.get("owner") or params.get("FEE_RECIPIENT")
        
        if not admin_address:
            return None
        
        # Check if it's a known multisig pattern
        known_multisigs = [
            "0x",  # Gnosis Safe pattern
        ]
        
        # Simple heuristic: EOAs are 20 bytes, contracts have code
        # In production, would check on-chain
        if admin_address and not self._is_likely_multisig(admin_address):
            return SafetyIssue(
                severity=Severity.HIGH,
                rule_id=self.rule_id,
                title="Admin is EOA",
                description=f"Admin address {admin_address[:10]}... appears to be an EOA, not a multisig.",
                recommendation="Consider using a multisig wallet (e.g., Gnosis Safe) for admin privileges.",
                can_override=True
            )
        
        return None
    
    def _is_likely_multisig(self, address: str) -> bool:
        # Placeholder - would check contract code in production
        return False


class ZeroAddressRule(SafetyRule):
    """Check for zero address in critical parameters"""
    
    rule_id = "ZERO_ADDRESS"
    
    CRITICAL_PARAMS = ["admin", "owner", "feeRecipient", "treasury", "FEE_RECIPIENT"]
    
    async def check(self, code: str, params: dict, network: str) -> Optional[SafetyIssue]:
        zero_addr = "0x0000000000000000000000000000000000000000"
        
        for param in self.CRITICAL_PARAMS:
            value = params.get(param, "")
            if value.lower() == zero_addr.lower():
                return SafetyIssue(
                    severity=Severity.CRITICAL,
                    rule_id=self.rule_id,
                    title=f"Zero address for {param}",
                    description=f"Parameter {param} is set to zero address, which will lock funds.",
                    recommendation=f"Set {param} to a valid address.",
                    can_override=False
                )
        
        return None


# backend/hyperagent/safety/rules/fee_checks.py
class HighFeeRule(SafetyRule):
    """Check for exploitative fee settings"""
    
    rule_id = "HIGH_FEE"
    
    FEE_LIMITS = {
        "performanceFee": 3000,  # 30%
        "PERFORMANCE_FEE": 3000,
        "managementFee": 500,    # 5%
        "swapFee": 1000,         # 10%
        "mintFee": 1000,
    }
    
    async def check(self, code: str, params: dict, network: str) -> Optional[SafetyIssue]:
        for fee_param, max_value in self.FEE_LIMITS.items():
            value = params.get(fee_param)
            
            if value and int(value) > max_value:
                return SafetyIssue(
                    severity=Severity.HIGH,
                    rule_id=self.rule_id,
                    title=f"High {fee_param}",
                    description=f"{fee_param} is set to {int(value)/100}%, which exceeds recommended maximum of {max_value/100}%.",
                    recommendation=f"Consider reducing {fee_param} to {max_value/100}% or below.",
                    can_override=True
                )
        
        return None


# backend/hyperagent/safety/rules/upgradeability_checks.py
class UpgradeabilityRule(SafetyRule):
    """Check for unsafe upgradeability patterns"""
    
    rule_id = "UNSAFE_UPGRADE"
    
    async def check(self, code: str, params: dict, network: str) -> Optional[SafetyIssue]:
        # Check for proxy patterns without timelock
        has_proxy = any(pattern in code for pattern in [
            "UUPSUpgradeable",
            "TransparentUpgradeableProxy",
            "upgradeTo(",
            "upgradeToAndCall("
        ])
        
        has_timelock = any(pattern in code for pattern in [
            "TimelockController",
            "timelock",
            "delay"
        ])
        
        if has_proxy and not has_timelock:
            return SafetyIssue(
                severity=Severity.MEDIUM,
                rule_id=self.rule_id,
                title="Upgradeable without timelock",
                description="Contract is upgradeable but has no timelock protection.",
                recommendation="Add a timelock (e.g., 24-48 hours) for upgrade operations to give users time to exit.",
                can_override=True
            )
        
        return None


# backend/hyperagent/safety/rules/network_checks.py
class MetisSpecificRule(SafetyRule):
    """Metis-specific safety checks"""
    
    rule_id = "METIS_SPECIFIC"
    networks = ["metis", "metis-testnet"]
    
    async def check(self, code: str, params: dict, network: str) -> Optional[SafetyIssue]:
        # Check for L2 considerations
        uses_block_number = "block.number" in code
        
        if uses_block_number:
            return SafetyIssue(
                severity=Severity.MEDIUM,
                rule_id=self.rule_id,
                title="block.number on Metis L2",
                description="Using block.number on Metis L2 may have different behavior than L1.",
                recommendation="Consider using block.timestamp for time-based logic on L2.",
                can_override=True
            )
        
        return None


class HyperionSpecificRule(SafetyRule):
    """Hyperion-specific safety checks"""
    
    rule_id = "HYPERION_SPECIFIC"
    networks = ["hyperion", "hyperion-testnet"]
    
    async def check(self, code: str, params: dict, network: str) -> Optional[SafetyIssue]:
        # Hyperion-specific checks
        # Add network-specific validations
        return None
```

```python
# backend/hyperagent/safety/reporter.py
from typing import List
from .checker import SafetyReport, SafetyIssue, Severity

class SafetyReporter:
    """Generate human-readable safety reports"""
    
    def format_report(self, report: SafetyReport) -> dict:
        """Format report for API response"""
        return {
            "passed": report.passed,
            "summary": self._get_summary(report),
            "issues": [self._format_issue(i) for i in report.issues],
            "can_deploy": report.passed or all(i.can_override for i in report.issues),
            "requires_override": not report.passed and all(i.can_override for i in report.issues)
        }
    
    def _get_summary(self, report: SafetyReport) -> str:
        if report.passed and report.warnings_count == 0:
            return "All safety checks passed. Safe to deploy."
        elif report.passed:
            return f"Passed with {report.warnings_count} warning(s). Review before deploying."
        else:
            return f"Blocked: {report.critical_count} critical issue(s) found."
    
    def _format_issue(self, issue: SafetyIssue) -> dict:
        return {
            "severity": issue.severity.value,
            "rule_id": issue.rule_id,
            "title": issue.title,
            "description": issue.description,
            "recommendation": issue.recommendation,
            "can_override": issue.can_override
        }
```

## Acceptance Criteria
- [ ] SafetyChecker framework implemented
- [ ] Admin EOA check working
- [ ] Zero address check (critical, blocks deploy)
- [ ] High fee check with limits
- [ ] Upgradeability check
- [ ] Metis-specific checks
- [ ] Hyperion-specific checks
- [ ] Safety report formatted for UI
- [ ] Deploy blocked for critical issues
- [ ] Override option for high/medium issues
- [ ] Unit tests for all rules
- [ ] Integration with deployment flow
- [ ] Dashboard shows warnings before deploy

## Dependencies
- TASK-S2-016: Slither Integration
- TASK-S5-033: DeFi Templates

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes
Month 3 Hyperion Milestone - Safety Checks

