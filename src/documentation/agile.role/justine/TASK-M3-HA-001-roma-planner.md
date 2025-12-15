# TASK-M3-HA-001: ROMA Planner Integration

## Metadata
- Assignee: Justine
- Role: CPOO/Project Architect
- Month: 3 (December 2025)
- Priority: P0
- Status: BACKLOG
- Due Date: 2025-12-20
- Estimated Hours: 10h
- Actual Hours: 

## Problem
ROMA planner not integrated. Without planner:
- Cannot decompose prompts
- No task planning
- Missing AI orchestration
- Core feature missing

Current state: ROMA planner not implemented.

## Goal
Integrate ROMA planner with GPT-5: decompose user prompts into phases (design, generate, audit, test, deploy). Include Firecrawl RAG context in planning.

## Success Metrics
- ROMA planner decomposes prompts into phases
- Firecrawl RAG context included in planning
- Plan output structured + executable
- Tested with 5+ prompt variations
- Documentation complete

## Technical Scope

Files to create/modify:
```
backend/
├── hyperagent/
│   └── orchestrator/
│       ├── roma_agent.py
│       └── planner.py
```

Dependencies:
- ROMA/DSPy
- GPT-5 API
- Firecrawl MCP

## Minimal Code

```python
# backend/hyperagent/orchestrator/roma_agent.py
from roma_dspy import ROMA
from firecrawl_mcp import Firecrawl

class HyperAgent:
    def __init__(self):
        self.roma = ROMA(
            model="gpt-5-turbo",
            profile="crypto_agent"
        )
        self.firecrawl = Firecrawl()

    async def plan(self, prompt: str) -> Plan:
        """
        Decompose user prompt into subtasks
        Returns: [design, generate, audit, test, deploy]
        """
        rag_context = await self.firecrawl.scrape([
            "https://github.com/Uniswap/v4-core/blob/main/README.md",
            "https://docs.aave.com/",
            "https://curve.readthedocs.io/"
        ])

        plan_prompt = f"""
        User Request: {prompt}
        
        Latest Documentation:
        {rag_context}
        
        Generate a JSON plan with these phases:
        1. "design": Architecture + data structures
        2. "generate": Solidity code generation
        3. "audit": Security analysis
        4. "test": Comprehensive testing
        5. "deploy": On-chain deployment
        
        For each phase, list subtasks with dependencies.
        """

        plan_output = await self.roma.asolve(plan_prompt, tools=[self.firecrawl])
        
        return Plan.parse_obj(plan_output)
```

## Acceptance Criteria
- [ ] ROMA planner decomposes prompts into phases
- [ ] Firecrawl RAG context included in planning
- [ ] Plan output structured + executable
- [ ] Tested with 5+ prompt variations
- [ ] Documentation complete

## Dependencies
None

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes

