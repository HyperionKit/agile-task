# TASK-M3-HA-005: LazAI + Phala TEE Integration

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
TEE integration not implemented. Without TEE:
- No attested audits
- Missing cryptographic proof
- Security claims unverifiable
- Platform incomplete

Current state: TEE integration not started.

## Goal
Integrate LazAI + Phala TEE: run audit inside TEE, get cryptographic attestation. Build artifacts signed.

## Success Metrics
- Phala TEE client connection working
- Audit execution in enclave
- Attestation quote generated
- Build artifacts signed
- Documentation complete

## Technical Scope

Files to create/modify:
```
backend/
├── hyperagent/
│   └── tee/
│       ├── lazai_tee.py
│       └── attestation.py
```

Dependencies:
- Phala TEE
- LazAI API
- TEE client library

## Minimal Code

```python
# backend/hyperagent/tee/lazai_tee.py
from alith import TappdClient
import json

class LazAITEEWorker:
    def __init__(self):
        self.tee_client = TappdClient(
            endpoint="https://phala.metis.io",
            worker_key=os.getenv("PHALA_WORKER_KEY")
        )

    async def attested_audit(self, contract_code: str) -> AttestedAuditResult:
        """
        Run audit inside TEE, get cryptographic attestation
        """
        audit_script = f"""
        import hashlib
        import json
        
        contract_code = {repr(contract_code)}
        
        # Run Slither inside TEE
        import subprocess
        result = subprocess.run(
            ["slither", "-", "--json"],
            input=contract_code,
            capture_output=True
        )
        
        findings = json.loads(result.stdout)
        
        # Deterministic hash of input + output
        audit_hash = hashlib.sha256(
            contract_code.encode() +
            json.dumps(findings).encode()
        ).hexdigest()
        
        print(json.dumps({{
            "contract_hash": hashlib.sha256(contract_code.encode()).hexdigest(),
            "audit_hash": audit_hash,
            "findings_count": len(findings.get("results", [])),
            "passed": len(findings.get("results", [])) == 0
        }}))
        """

        result = await self.tee_client.execute_remote(
            code=audit_script,
            timeout=60,
            encrypted=True
        )

        output = json.loads(result.output)
        attestation = result.attestation

        return AttestedAuditResult(
            contractHash=output["contract_hash"],
            auditHash=output["audit_hash"],
            findingsCount=output["findings_count"],
            passed=output["passed"],
            attestationQuote=attestation,
            executedAt=datetime.now(),
            teeProvider="phala"
        )

    async def attested_build(
        self,
        contracts: List[Contract],
        solc_version: str = "0.8.24"
    ) -> AttestedBuildResult:
        """
        Compile contracts inside TEE, return signed bytecode
        """
        build_script = f"""
        import subprocess
        import json
        import hashlib
        
        # Compile with Foundry in TEE
        result = subprocess.run(
            [
                "solc",
                "--version", "{solc_version}",
                "--optimize",
                "--optimize-runs", "200",
                "-",
                "--bin", "--abi"
            ],
            input={repr(chr(10).join([c.code for c in contracts]))},
            capture_output=True
        )
        
        artifacts = {{}}
        for contract in {json.dumps([c.name for c in contracts])}:
            artifacts[contract] = {{
                "bytecode": "0x..." + result.stdout.decode(),
                "hash": hashlib.sha256(result.stdout).hexdigest()
            }}
        
        build_hash = hashlib.sha256(
            json.dumps(artifacts).encode()
        ).hexdigest()
        
        print(json.dumps({{
            "artifacts": artifacts,
            "buildHash": build_hash,
            "solcVersion": "{solc_version}",
            "timestamp": "{datetime.now().isoformat()}"
        }}))
        """

        result = await self.tee_client.execute_remote(
            code=build_script,
            timeout=120
        )

        output = json.loads(result.output)

        return AttestedBuildResult(
            artifacts={
                name: Artifact(
                    bytecode=info["bytecode"],
                    hash=info["hash"]
                )
                for name, info in output["artifacts"].items()
            },
            buildHash=output["buildHash"],
            attestationQuote=result.attestation,
            solcVersion=output["solcVersion"]
        )
```

## Acceptance Criteria
- [ ] Phala TEE client connection working
- [ ] Audit execution in enclave
- [ ] Attestation quote generated
- [ ] Build artifacts signed
- [ ] Documentation complete

## Dependencies
- TASK-M3-HA-004: Slither + AI Audit Orchestration

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes

