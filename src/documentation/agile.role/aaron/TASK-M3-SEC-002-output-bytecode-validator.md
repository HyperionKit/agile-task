# TASK-M3-SEC-002: Output Bytecode Validator

## Metadata
- Assignee: Aaron
- Role: CTO/Project Architect
- Month: 3 (December 2025)
- Priority: P0
- Status: BACKLOG
- Due Date: 2025-12-15
- Estimated Hours: 10h
- Actual Hours: 

## Problem
No output bytecode validation. Without validation:
- Model poisoning attacks possible
- Malicious bytecode deployed
- User funds at risk
- Platform reputation damaged

Current state: LLM output not validated before deployment.

## Goal
Implement output bytecode validator to prevent model poisoning attacks. All AI-generated code must pass validation before deployment.

## Success Metrics
- Bytecode validation implemented
- Model poisoning attacks blocked
- Critical patterns detected
- Validation integrated into pipeline
- Security audit passed

## Technical Scope

Files to create/modify:
```
backend/
├── hyperagent/
│   └── security/
│       └── output_validator.py
```

Dependencies:
- Slither
- Solidity compiler
- Pattern matching library

## Minimal Code

```python
# backend/hyperagent/security/output_validator.py
import re
import subprocess
import tempfile
from dataclasses import dataclass
from enum import Enum
from typing import List, Optional
import yaml

class Severity(Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"

@dataclass
class ValidationFinding:
    severity: Severity
    title: str
    description: str
    line: Optional[int] = None
    pattern: Optional[str] = None

class OutputValidationError(Exception):
    """Raised when output fails validation"""
    pass

class OutputValidator:
    """
    Multi-layer validation of AI-generated smart contract code.
    Catches malicious patterns, syntax errors, and vulnerabilities.
    """
    
    # Patterns that should NEVER appear in generated code
    CRITICAL_PATTERNS = [
        {
            "name": "selfdestruct",
            "pattern": r"\bselfdestruct\s*\(",
            "severity": Severity.CRITICAL,
            "description": "Contract can be destroyed, draining all funds"
        },
        {
            "name": "delegatecall_to_variable",
            "pattern": r"\.delegatecall\s*\([^)]*\b(?!0x)[a-zA-Z_]",
            "severity": Severity.CRITICAL,
            "description": "Delegatecall to variable address allows hijacking"
        },
        {
            "name": "tx_origin_auth",
            "pattern": r"require\s*\([^)]*tx\.origin",
            "severity": Severity.HIGH,
            "description": "tx.origin authentication vulnerable to phishing"
        },
        {
            "name": "timestamp_manipulation",
            "pattern": r"block\.timestamp\s*[<>=]+\s*.*require",
            "severity": Severity.MEDIUM,
            "description": "Timestamp can be manipulated by miners"
        },
        {
            "name": "arbitrary_send",
            "pattern": r"\.call\{value:\s*[^}]+\}\s*\([\"'][\s]*[\"']\)",
            "severity": Severity.HIGH,
            "description": "Arbitrary ETH send without access control"
        }
    ]
    
    # Honeypot patterns that trap user funds
    HONEYPOT_PATTERNS = [
        {
            "name": "hidden_transfer_fee",
            "pattern": r"_transfer.*amount\s*-\s*\d+",
            "severity": Severity.HIGH,
            "description": "Hidden fee deducted from transfers"
        },
        {
            "name": "blacklist_all",
            "pattern": r"mapping.*blacklist.*transfer.*require.*!blacklist",
            "severity": Severity.HIGH,
            "description": "Blacklist can prevent all transfers"
        },
        {
            "name": "max_tx_zero",
            "pattern": r"maxTxAmount\s*=\s*0",
            "severity": Severity.CRITICAL,
            "description": "Max transaction set to zero, blocking trades"
        }
    ]
    
    def __init__(self):
        self.patterns = self.CRITICAL_PATTERNS + self.HONEYPOT_PATTERNS
    
    def validate_syntax(self, code: str) -> List[ValidationFinding]:
        """Check Solidity syntax validity"""
        findings = []
        
        # Basic structure checks
        if "pragma solidity" not in code:
            findings.append(ValidationFinding(
                severity=Severity.CRITICAL,
                title="Missing pragma",
                description="No Solidity version pragma found"
            ))
        
        if "contract " not in code.lower():
            findings.append(ValidationFinding(
                severity=Severity.CRITICAL,
                title="No contract definition",
                description="Code does not define any contract"
            ))
        
        # Bracket balance
        if code.count("{") != code.count("}"):
            findings.append(ValidationFinding(
                severity=Severity.CRITICAL,
                title="Unbalanced brackets",
                description="Mismatched { and } brackets"
            ))
        
        # Try compilation
        try:
            self._try_compile(code)
        except Exception as e:
            findings.append(ValidationFinding(
                severity=Severity.CRITICAL,
                title="Compilation failed",
                description=str(e)[:200]
            ))
        
        return findings
    
    def validate_patterns(self, code: str) -> List[ValidationFinding]:
        """Scan for dangerous and honeypot patterns"""
        findings = []
        lines = code.split('\n')
        
        for pattern_def in self.patterns:
            pattern = re.compile(pattern_def["pattern"], re.IGNORECASE | re.MULTILINE)
            
            for i, line in enumerate(lines, 1):
                if pattern.search(line):
                    findings.append(ValidationFinding(
                        severity=pattern_def["severity"],
                        title=pattern_def["name"],
                        description=pattern_def["description"],
                        line=i,
                        pattern=pattern_def["pattern"]
                    ))
        
        return findings
    
    async def run_slither(self, code: str) -> List[ValidationFinding]:
        """Run Slither static analysis"""
        findings = []
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.sol', delete=False) as f:
            f.write(code)
            temp_path = f.name
        
        try:
            result = subprocess.run(
                ['slither', temp_path, '--json', '-'],
                capture_output=True,
                text=True,
                timeout=60
            )
            
            if result.returncode != 0:
                import json
                slither_output = json.loads(result.stdout)
                
                for detector in slither_output.get('results', {}).get('detectors', []):
                    severity_map = {
                        'High': Severity.HIGH,
                        'Medium': Severity.MEDIUM,
                        'Low': Severity.LOW,
                        'Informational': Severity.INFO
                    }
                    
                    findings.append(ValidationFinding(
                        severity=severity_map.get(detector['impact'], Severity.INFO),
                        title=detector['check'],
                        description=detector['description'][:200],
                        line=detector.get('first_markdown_element', {}).get('start', {}).get('line')
                    ))
                    
        except subprocess.TimeoutExpired:
            findings.append(ValidationFinding(
                severity=Severity.INFO,
                title="Slither timeout",
                description="Analysis took too long, skipped"
            ))
        finally:
            import os
            os.unlink(temp_path)
        
        return findings
    
    def _try_compile(self, code: str):
        """Attempt Solidity compilation"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.sol', delete=False) as f:
            f.write(code)
            temp_path = f.name
        
        try:
            result = subprocess.run(
                ['solc', '--bin', temp_path],
                capture_output=True,
                text=True,
                timeout=30
            )
            if result.returncode != 0:
                raise Exception(result.stderr[:500])
        finally:
            import os
            os.unlink(temp_path)
    
    async def validate(self, code: str) -> tuple[bool, List[ValidationFinding]]:
        """
        Full validation pipeline.
        Returns (is_safe, findings).
        """
        all_findings = []
        
        # Layer 1: Syntax validation
        syntax_findings = self.validate_syntax(code)
        all_findings.extend(syntax_findings)
        
        # If syntax fails, stop here
        if any(f.severity == Severity.CRITICAL for f in syntax_findings):
            return False, all_findings
        
        # Layer 2: Pattern matching
        pattern_findings = self.validate_patterns(code)
        all_findings.extend(pattern_findings)
        
        # Layer 3: Slither analysis
        slither_findings = await self.run_slither(code)
        all_findings.extend(slither_findings)
        
        # Determine if safe
        critical_count = sum(1 for f in all_findings if f.severity == Severity.CRITICAL)
        high_count = sum(1 for f in all_findings if f.severity == Severity.HIGH)
        
        is_safe = critical_count == 0 and high_count == 0
        
        return is_safe, all_findings
```

## Acceptance Criteria
- [ ] OutputValidator class implemented
- [ ] Syntax validation working
- [ ] Pattern matching functional
- [ ] Slither integration complete
- [ ] Validation integrated into pipeline
- [ ] Security audit passed

## Dependencies
- TASK-M1-OVERDUE-007: Code Validation and Security Scanning

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes

