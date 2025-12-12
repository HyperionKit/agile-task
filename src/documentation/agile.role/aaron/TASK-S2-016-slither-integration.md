# TASK-S2-016: Slither Integration

## Metadata
- Assignee: Aaron
- Role: CTO/Project Architect
- Sprint: 2
- Priority: P1
- Status: BACKLOG
- Due Date: 2026-01-06
- Estimated Hours: 6h
- Actual Hours: 

## Problem
AI-generated code may contain vulnerabilities. Without static analysis:
- Security bugs deployed to production
- Users lose funds
- Platform reputation damaged
- No audit trail

Current state: No automated security scanning. Manual review only.

## Goal
Integrate Slither for automated static analysis of all generated Solidity code before deployment.

## Success Metrics
- All generated code scanned
- Critical/High issues block deployment
- Scan completes in under 30 seconds
- 95%+ of known vulnerabilities caught
- Clear audit reports generated

## Technical Scope

Files to create:
```
backend/hyperagent/
├── audit/
│   ├── __init__.py
│   ├── slither_runner.py
│   ├── report_generator.py
│   └── severity.py
└── tests/
    └── test_slither.py
```

Dependencies:
- slither-analyzer
- solc-select
- crytic-compile

## Minimal Code

```python
# backend/hyperagent/audit/slither_runner.py
import subprocess
import tempfile
import json
from dataclasses import dataclass
from enum import Enum
from typing import List, Optional
import os

class Severity(Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "informational"

@dataclass
class Finding:
    severity: Severity
    check: str
    title: str
    description: str
    line: Optional[int] = None
    recommendation: Optional[str] = None

@dataclass
class AuditReport:
    passed: bool
    findings: List[Finding]
    summary: dict
    scan_time: float

class SlitherRunner:
    """
    Runs Slither static analysis on Solidity code.
    Blocks deployment on critical/high findings.
    """
    
    BLOCKING_SEVERITIES = [Severity.CRITICAL, Severity.HIGH]
    
    DETECTOR_SEVERITY_MAP = {
        "reentrancy-eth": Severity.HIGH,
        "reentrancy-no-eth": Severity.MEDIUM,
        "suicidal": Severity.CRITICAL,
        "unprotected-upgrade": Severity.CRITICAL,
        "arbitrary-send": Severity.HIGH,
        "controlled-delegatecall": Severity.CRITICAL,
        "tx-origin": Severity.MEDIUM,
        "unchecked-transfer": Severity.HIGH,
        "locked-ether": Severity.MEDIUM,
        "shadowing-state": Severity.HIGH,
        "uninitialized-state": Severity.HIGH,
        "uninitialized-storage": Severity.HIGH,
    }
    
    def __init__(self, solc_version: str = "0.8.24"):
        self.solc_version = solc_version
        self._ensure_solc()
    
    def _ensure_solc(self):
        """Ensure correct solc version is installed"""
        subprocess.run(
            ["solc-select", "install", self.solc_version],
            capture_output=True
        )
        subprocess.run(
            ["solc-select", "use", self.solc_version],
            capture_output=True
        )
    
    async def analyze(self, code: str) -> AuditReport:
        """Run Slither analysis on code"""
        import time
        start = time.time()
        
        # Write code to temp file
        with tempfile.NamedTemporaryFile(
            mode='w',
            suffix='.sol',
            delete=False
        ) as f:
            f.write(code)
            temp_path = f.name
        
        try:
            # Run Slither
            result = subprocess.run(
                [
                    "slither",
                    temp_path,
                    "--json", "-",
                    "--exclude-informational",
                    "--exclude-low"
                ],
                capture_output=True,
                text=True,
                timeout=60
            )
            
            # Parse results
            findings = self._parse_results(result.stdout)
            
            # Check if passed
            blocking = [
                f for f in findings
                if f.severity in self.BLOCKING_SEVERITIES
            ]
            
            scan_time = time.time() - start
            
            return AuditReport(
                passed=len(blocking) == 0,
                findings=findings,
                summary={
                    "total": len(findings),
                    "critical": sum(1 for f in findings if f.severity == Severity.CRITICAL),
                    "high": sum(1 for f in findings if f.severity == Severity.HIGH),
                    "medium": sum(1 for f in findings if f.severity == Severity.MEDIUM),
                    "low": sum(1 for f in findings if f.severity == Severity.LOW),
                },
                scan_time=scan_time
            )
            
        finally:
            os.unlink(temp_path)
    
    def _parse_results(self, output: str) -> List[Finding]:
        """Parse Slither JSON output"""
        findings = []
        
        try:
            data = json.loads(output)
            detectors = data.get("results", {}).get("detectors", [])
            
            for detector in detectors:
                severity = self.DETECTOR_SEVERITY_MAP.get(
                    detector["check"],
                    Severity(detector["impact"].lower())
                )
                
                finding = Finding(
                    severity=severity,
                    check=detector["check"],
                    title=detector["check"].replace("-", " ").title(),
                    description=detector["description"][:500],
                    line=self._extract_line(detector),
                    recommendation=self._get_recommendation(detector["check"])
                )
                findings.append(finding)
                
        except json.JSONDecodeError:
            pass
        
        return findings
    
    def _extract_line(self, detector: dict) -> Optional[int]:
        """Extract line number from detector"""
        elements = detector.get("elements", [])
        if elements:
            source = elements[0].get("source_mapping", {})
            return source.get("lines", [None])[0]
        return None
    
    def _get_recommendation(self, check: str) -> str:
        """Get fix recommendation for check"""
        recommendations = {
            "reentrancy-eth": "Use ReentrancyGuard or checks-effects-interactions pattern",
            "suicidal": "Remove selfdestruct or add proper access control",
            "arbitrary-send": "Add access control to ETH transfers",
            "tx-origin": "Use msg.sender instead of tx.origin",
            "unchecked-transfer": "Check return value of transfer calls",
        }
        return recommendations.get(check, "Review and fix the issue")
```

## Acceptance Criteria
- [ ] Slither installed and configured
- [ ] SlitherRunner class implemented
- [ ] Solc version management
- [ ] JSON output parsing
- [ ] Severity classification
- [ ] Critical/High findings block deployment
- [ ] Audit report generation
- [ ] Line number extraction
- [ ] Fix recommendations
- [ ] Scan under 30 seconds
- [ ] Unit tests with known vulnerable contracts
- [ ] Integration with build pipeline

## Dependencies
- TASK-S2-013: Claude Integration

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes


