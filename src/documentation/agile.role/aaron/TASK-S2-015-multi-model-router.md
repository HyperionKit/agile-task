# TASK-S2-015: Multi-Model Router

## Metadata
- Assignee: Aaron
- Role: CTO/Project Architect
- Sprint: 2
- Priority: P1
- Status: BACKLOG
- Due Date: 2026-01-04
- Estimated Hours: 8h
- Actual Hours: 

## Problem
Different tasks require different AI models. Without a router:
- One model for everything (suboptimal)
- No cost optimization
- No fallback on failures
- Cannot leverage model specializations

Current state: Direct model calls. No routing or fallback logic.

## Goal
Implement multi-model router that selects optimal model per task and provides automatic fallback on failures.

## Success Metrics
- Correct model selected for each task type
- Fallback triggers on timeout/error
- Cost reduced by 30% vs single model
- Latency within SLA (30s)
- 99.5% success rate with fallbacks

## Technical Scope

Files to create:
```
backend/hyperagent/
├── router/
│   ├── __init__.py
│   ├── multi_model_router.py
│   ├── model_registry.py
│   └── cost_calculator.py
└── tests/
    └── test_router.py
```

Dependencies:
- anthropic
- openai
- together (for Llama)
- google-generativeai

## Minimal Code

```python
# backend/hyperagent/router/multi_model_router.py
from dataclasses import dataclass
from typing import Dict, Optional, Tuple
import asyncio
import time

@dataclass
class ModelConfig:
    name: str
    provider: str
    cost_per_1k_tokens: float
    timeout: int
    max_tokens: int
    quality_score: float

class MultiModelRouter:
    """
    Routes tasks to optimal models with automatic fallback.
    Optimizes for quality, cost, and latency.
    """
    
    MODELS = {
        "claude-opus-4.5": ModelConfig(
            name="claude-opus-4.5",
            provider="anthropic",
            cost_per_1k_tokens=0.015,
            timeout=30,
            max_tokens=4096,
            quality_score=0.95
        ),
        "gpt-4-turbo": ModelConfig(
            name="gpt-4-turbo",
            provider="openai",
            cost_per_1k_tokens=0.01,
            timeout=25,
            max_tokens=4096,
            quality_score=0.90
        ),
        "llama-3.1-405b": ModelConfig(
            name="llama-3.1-405b",
            provider="together",
            cost_per_1k_tokens=0.003,
            timeout=20,
            max_tokens=4096,
            quality_score=0.85
        ),
        "gemini-pro": ModelConfig(
            name="gemini-pro",
            provider="google",
            cost_per_1k_tokens=0.005,
            timeout=20,
            max_tokens=4096,
            quality_score=0.88
        )
    }
    
    TASK_ROUTING = {
        "solidity_codegen": {
            "primary": "claude-opus-4.5",
            "fallbacks": ["gpt-4-turbo", "llama-3.1-405b"],
            "min_quality": 0.90
        },
        "gas_optimization": {
            "primary": "llama-3.1-405b",
            "fallbacks": ["claude-opus-4.5"],
            "min_quality": 0.80
        },
        "ui_design": {
            "primary": "gemini-pro",
            "fallbacks": ["gpt-4-turbo"],
            "min_quality": 0.85
        },
        "semantic_audit": {
            "primary": "claude-opus-4.5",
            "fallbacks": ["gpt-4-turbo"],
            "min_quality": 0.95
        },
        "planning": {
            "primary": "gpt-4-turbo",
            "fallbacks": ["claude-opus-4.5"],
            "min_quality": 0.90
        }
    }
    
    def __init__(self):
        self.clients = self._init_clients()
        self.metrics = RouterMetrics()
    
    async def route(
        self,
        task: str,
        prompt: str,
        context: Optional[dict] = None,
        budget: Optional[float] = None
    ) -> Tuple[str, float]:
        """
        Route task to optimal model with fallback.
        Returns (result, cost).
        """
        
        routing = self.TASK_ROUTING.get(task)
        if not routing:
            raise ValueError(f"Unknown task: {task}")
        
        models_to_try = [routing["primary"]] + routing["fallbacks"]
        
        for model_name in models_to_try:
            model = self.MODELS[model_name]
            
            # Check budget
            if budget and self._estimate_cost(prompt, model) > budget:
                continue
            
            try:
                start = time.time()
                result = await asyncio.wait_for(
                    self._call_model(model, prompt, context),
                    timeout=model.timeout
                )
                latency = time.time() - start
                
                # Validate quality
                quality = await self._score_quality(result, task)
                if quality < routing["min_quality"]:
                    self.metrics.log_quality_fail(model_name, quality)
                    continue
                
                # Calculate cost
                cost = self._calculate_cost(prompt, result, model)
                
                # Log success
                self.metrics.log_success(model_name, task, latency, cost)
                
                return result, cost
                
            except asyncio.TimeoutError:
                self.metrics.log_timeout(model_name)
                continue
            except Exception as e:
                self.metrics.log_error(model_name, str(e))
                continue
        
        raise RuntimeError(f"All models failed for task: {task}")
    
    async def _call_model(
        self,
        model: ModelConfig,
        prompt: str,
        context: Optional[dict]
    ) -> str:
        """Call specific model provider"""
        
        client = self.clients[model.provider]
        
        if model.provider == "anthropic":
            response = await client.messages.create(
                model=model.name,
                max_tokens=model.max_tokens,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.content[0].text
            
        elif model.provider == "openai":
            response = await client.chat.completions.create(
                model=model.name,
                max_tokens=model.max_tokens,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.choices[0].message.content
            
        elif model.provider == "together":
            response = await client.chat.completions.create(
                model=f"meta-llama/{model.name}",
                max_tokens=model.max_tokens,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.choices[0].message.content
            
        elif model.provider == "google":
            response = await client.generate_content(prompt)
            return response.text
    
    def _calculate_cost(
        self,
        prompt: str,
        result: str,
        model: ModelConfig
    ) -> float:
        """Calculate token cost"""
        input_tokens = len(prompt) / 4  # Approximate
        output_tokens = len(result) / 4
        total_tokens = input_tokens + output_tokens
        return (total_tokens / 1000) * model.cost_per_1k_tokens
```

## Acceptance Criteria
- [ ] MultiModelRouter class implemented
- [ ] All 4 model providers integrated
- [ ] Task routing configuration
- [ ] Primary + fallback chain
- [ ] Timeout handling per model
- [ ] Quality scoring and threshold
- [ ] Cost calculation
- [ ] Budget enforcement
- [ ] Metrics logging
- [ ] Unit tests for routing logic
- [ ] Integration tests with real APIs
- [ ] 99.5% success rate verified

## Dependencies
- TASK-S2-013: Claude Integration

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes


