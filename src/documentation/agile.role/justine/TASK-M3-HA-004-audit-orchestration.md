# TASK-M3-HA-004: Slither + AI Audit Orchestration

## Metadata
- Assignee: Justine
- Role: CPOO/Project Architect
- Month: 3 (December 2025)
- Priority: P0
- Status: BACKLOG
- Due Date: 2025-12-20
- Estimated Hours: 12h
- Actual Hours: 

## Problem
Audit orchestration not built. Without orchestration:
- No security analysis
- Vulnerable code deployed
- User funds at risk
- Missing core feature

Current state: Audit system not implemented.

## Goal
Build audit orchestration: Slither static analysis + AI semantic analysis. Vulnerability detection, pass/fail logic, attested reports.

## Success Metrics
- Slither execution + parsing working
- AI analysis functional
- Vulnerability detection working
- Pass/fail logic correct
- Documentation complete

## Technical Scope

Files to create/modify:
```
backend/
├── hyperagent/
│   └── audit/
│       ├── slither_auditor.py
│       ├── ai_auditor.py
│       └── report_generator.py
```

Dependencies:
- Slither
- Claude/GPT-5
- TEE (for attestation)

## Minimal Code

```python
# backend/hyperagent/audit/audit_orchestrator.py
import subprocess
import json

class AuditOrchestrator:
    def __init__(self):
        self.slither_path = "/usr/local/bin/slither"
        self.llm = "gpt-5-turbo"

    async def run_full_audit(self, contract_code: str) -> AuditReport:
        """
        Run comprehensive audit: static + AI analysis
        """
        # 1. Slither static analysis
        slither_results = await self.run_slither(contract_code)

        # 2. AI semantic analysis
        ai_results = await self.analyze_with_ai(contract_code, slither_results)

        # 3. Aggregate
        report = AuditReport(
            timestamp=datetime.now(),
            contract_hash=keccak256(contract_code),
            slither_findings=slither_results,
            ai_findings=ai_results,
            severity=max(
                slither_results.severity,
                ai_results.severity
            ),
            pass_fail=self.determine_pass_fail(
                slither_results,
                ai_results
            )
        )

        return report

    async def run_slither(self, contract_code: str) -> SlitherResults:
        """
        Execute Slither static analysis
        """
        with tempfile.NamedTemporaryFile(mode="w", suffix=".sol", delete=False) as f:
            f.write(contract_code)
            temp_path = f.name

        try:
            result = subprocess.run(
                [self.slither_path, temp_path, "--json", "-"],
                capture_output=True,
                text=True,
                timeout=30
            )

            output = json.loads(result.stdout)

            return SlitherResults(
                detectors=[
                    Detection(
                        type=d["type"],
                        severity=d["severity"],
                        description=d["description"],
                        sourceMapping=d.get("source_mapping")
                    )
                    for d in output.get("results", [])
                ],
                severity=self.get_max_severity(
                    output.get("results", [])
                ),
                passed=len(output.get("results", [])) == 0
            )
        finally:
            os.unlink(temp_path)

    async def analyze_with_ai(
        self,
        contract_code: str,
        slither_results: SlitherResults
    ) -> AIAuditResults:
        """
        AI-powered semantic analysis
        """
        slither_summary = "\n".join([
            f"- [{d.severity}] {d.type}: {d.description}"
            for d in slither_results.detectors
        ])

        prompt = f"""
        Review this Solidity contract for security issues:
        
        ```solidity
        {contract_code}
        ```
        
        Slither found:
        {slither_summary}
        
        Perform a security review checking:
        1. Reentrancy vulnerabilities
        2. Integer overflow/underflow (even with 0.8+)
        3. Unchecked external calls
        4. Access control gaps
        5. Logic errors in AMM/swap functions
        6. Gas optimization opportunities
        
        Return JSON:
        {{
          "vulnerabilities": [
            {{
              "type": "reentrancy",
              "severity": "high",
              "location": "line 42",
              "description": "...",
              "recommendation": "..."
            }}
          ],
          "positives": ["Well-structured state", "Good natspec", ...],
          "summary": "..."
        }}
        """

        response = await self.call_claude(prompt)
        analysis = json.loads(response)

        return AIAuditResults(
            vulnerabilities=[
                Vulnerability(
                    type=v["type"],
                    severity=v["severity"],
                    location=v["location"],
                    description=v["description"],
                    recommendation=v["recommendation"]
                )
                for v in analysis.get("vulnerabilities", [])
            ],
            positives=analysis.get("positives", []),
            summary=analysis.get("summary", ""),
            severity=max(
                [v["severity"] for v in analysis.get("vulnerabilities", ["low"])]
            )
        )

    def determine_pass_fail(
        self,
        slither: SlitherResults,
        ai: AIAuditResults
    ) -> bool:
        """
        Pass if: no HIGH severity findings
        """
        high_slither = any(d.severity == "high" for d in slither.detectors)
        high_ai = any(v.severity == "high" for v in ai.vulnerabilities)

        return not (high_slither or high_ai)
```

## Acceptance Criteria
- [ ] Slither execution + parsing
- [ ] AI analysis functional
- [ ] Vulnerability detection working
- [ ] Pass/fail logic correct
- [ ] Documentation complete

## Dependencies
- TASK-M1-OVERDUE-007: Code Validation and Security Scanning
- TASK-M3-HA-003: Solidity Code Generator

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes

