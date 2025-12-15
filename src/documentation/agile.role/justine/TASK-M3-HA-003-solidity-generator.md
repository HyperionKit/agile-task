# TASK-M3-HA-003: Solidity Code Generator

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
Solidity code generator not built. Without generator:
- Cannot generate contracts
- No AI code generation
- Missing core feature
- Platform non-functional

Current state: Code generator not implemented.

## Goal
Build Solidity code generator: generate valid, auditable Solidity code based on spec + RAG context. Follows patterns from examples, includes natspec comments, events, gas-efficient.

## Success Metrics
- Generates valid Solidity (compiles with Foundry)
- Follows patterns from RAG docs
- Includes storage layout + functions
- Tested on 5+ contract types
- Documentation complete

## Technical Scope

Files to create/modify:
```
backend/
├── hyperagent/
│   └── codegen/
│       ├── solidity_generator.py
│       └── contract_spec.py
```

Dependencies:
- Claude Opus 4.5
- RAG context
- Foundry

## Minimal Code

```python
# backend/hyperagent/codegen/solidity_generator.py
class SolidityGenerator:
    def __init__(self, rag_context: str):
        self.rag_context = rag_context
        self.model = "claude-opus-4.5"

    async def generate_contracts(
        self,
        specification: ContractSpec
    ) -> GeneratedContracts:
        """
        Generate Solidity contracts based on spec + RAG context
        """
        prompt = f"""
        Contract Specification:
        {json.dumps(specification.dict(), indent=2)}
        
        Relevant Code Examples:
        {self.rag_context}
        
        Generate production-ready Solidity contracts that:
        1. Follow the spec exactly
        2. Use patterns from the examples
        3. Are auditable (clear logic, no complex tricks)
        4. Include natspec comments
        5. Have event emissions
        6. Are gas-efficient
        
        Return a JSON object with:
        {{
          "contracts": [
            {{
              "name": "ContractName",
              "code": "pragma solidity ^0.8.0;\\n...",
              "storage": [
                {{"name": "counter", "type": "uint256"}}
              ],
              "functions": [
                {{"name": "increment", "selector": "0xd09de08a"}}
              ]
            }}
          ],
          "imports": ["@openzeppelin/contracts/..."],
          "notes": "..."
        }}
        """

        response = await self.call_llm(prompt)
        generated = json.loads(response)

        return GeneratedContracts(
            contracts=[
                Contract(
                    name=c["name"],
                    code=c["code"],
                    storage=c["storage"],
                    functions=c["functions"]
                )
                for c in generated["contracts"]
            ],
            imports=generated["imports"],
            notes=generated["notes"]
        )

    async def call_llm(self, prompt: str) -> str:
        """
        Call Claude with retry logic
        """
        for attempt in range(3):
            try:
                message = await self.client.messages.create(
                    model=self.model,
                    max_tokens=4096,
                    messages=[{"role": "user", "content": prompt}]
                )
                return message.content[0].text
            except RateLimitError:
                if attempt < 2:
                    await asyncio.sleep(2 ** attempt)
                else:
                    raise
```

## Acceptance Criteria
- [ ] Generates valid Solidity (compiles with Foundry)
- [ ] Follows patterns from RAG docs
- [ ] Includes storage layout + functions
- [ ] Tested on 5+ contract types
- [ ] Documentation complete

## Dependencies
- TASK-M3-HA-002: Firecrawl RAG Pipeline
- TASK-M1-OVERDUE-003: Integrate 1-2 Specific AI Models

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes

