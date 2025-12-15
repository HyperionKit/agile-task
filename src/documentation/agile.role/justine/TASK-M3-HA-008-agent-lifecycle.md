# TASK-M3-HA-008: Full Agent Lifecycle

## Metadata
- Assignee: Justine
- Role: CPOO/Project Architect
- Month: 3 (December 2025)
- Priority: P0
- Status: BACKLOG
- Due Date: 2025-12-20
- Estimated Hours: 14h
- Actual Hours: 

## Problem
Full agent lifecycle not implemented. Without lifecycle:
- Cannot build dApps end-to-end
- Missing orchestration
- No complete workflow
- Platform incomplete

Current state: Agent lifecycle not built.

## Goal
Build full agent lifecycle: prompt → deployed dApp in <90 seconds. All phases executed in order: plan, design, generate, audit, test, deploy, monitor.

## Success Metrics
- End-to-end build completes
- All phases executed in order
- Contracts deployed + verified
- Monitoring active
- Time < 90 seconds

## Technical Scope

Files to create/modify:
```
backend/
├── hyperagent/
│   └── agent/
│       └── agent.py
```

Dependencies:
- All previous HyperAgent tasks
- SDK integration
- AA integration

## Minimal Code

```python
# backend/hyperagent/agent/agent.py
from roma_dspy import ROMA

class HyperAgent:
    def __init__(self):
        self.roma = ROMA(model="gpt-5-turbo", profile="crypto_agent")
        self.rag = RagPipeline()
        self.codegen = SolidityGenerator()
        self.audit = AuditOrchestrator()
        self.tee = LazAITEEWorker()
        self.deployer = FoundryDeployer()
        self.monitor = HyperAgentMonitor()

    async def build_dapp(self, user_prompt: str) -> BuildResult:
        """
        End-to-end: prompt → deployed + audited dApp
        """
        start = asyncio.get_event_loop().time()

        # 1. PLAN
        rag_context = await self.rag.generate_context(user_prompt)
        plan = await self.roma.asolve(
            f"{user_prompt}\n\nContext: {rag_context}",
            tools=[self.rag.firecrawl]
        )

        # 2. DESIGN + SPEC
        spec = await self.extract_spec_from_plan(plan, user_prompt)

        # 3. GENERATE CODE
        generator = SolidityGenerator(rag_context)
        contracts = await generator.generate_contracts(spec)

        # 4. AUDIT (in TEE)
        audit_results = []
        for contract in contracts.contracts:
            result = await self.tee.attested_audit(contract.code)
            audit_results.append(result)

        if any(not r.passed for r in audit_results):
            return BuildResult(
                status="failed",
                reason="Audit failed",
                auditResults=audit_results
            )

        # 5. BUILD (in TEE)
        build_result = await self.tee.attested_build(contracts.contracts)

        # 6. TEST
        test_results = await self.run_tests(contracts.contracts)

        # 7. DEPLOY
        deployment = await self.deployer.deploy_contracts(
            contracts.contracts,
            constructor_args=spec.constructorArgs
        )

        # 8. MONITOR
        asyncio.create_task(
            self.monitor.monitor_deployed_app(
                deployment_id=f"dep_{int(time.time())}",
                contracts=deployment.deployments,
                chain=spec.chain
            )
        )

        elapsed = asyncio.get_event_loop().time() - start

        return BuildResult(
            status="success",
            plan=plan,
            contracts=contracts,
            auditResults=audit_results,
            buildResult=build_result,
            deployment=deployment,
            monitoringStarted=True,
            totalTime=elapsed
        )
```

## Acceptance Criteria
- [ ] End-to-end build completes
- [ ] All phases executed in order
- [ ] Contracts deployed + verified
- [ ] Monitoring active
- [ ] Time < 90 seconds

## Dependencies
- All previous HyperAgent tasks
- SDK integration
- AA integration

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes

