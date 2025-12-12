# TASK-S2-014: ROMA Planner Implementation

## Metadata
- Assignee: Aaron
- Role: CTO/Project Architect
- Sprint: 2
- Priority: P1
- Status: BACKLOG
- Due Date: 2026-01-02
- Estimated Hours: 12h
- Actual Hours: 

## Problem
Complex build requests require multi-step decomposition. Without ROMA planner:
- Single model handles everything (slow, expensive)
- No task parallelization
- Complex prompts fail more often
- Cannot route tasks to specialized models

Current state: All prompts go directly to single model. No planning layer.

## Goal
Implement ROMA (Reasoning, Orchestration, Memory, Action) planner to decompose complex requests into subtasks and route to appropriate models.

## Success Metrics
- Complex prompts decomposed correctly
- Subtasks routed to correct models
- 40% faster than single-model approach
- Parallel execution working
- State maintained across steps

## Technical Scope

Files to create:
```
backend/hyperagent/
├── orchestrator/
│   ├── __init__.py
│   ├── roma_planner.py
│   ├── task_graph.py
│   └── state_manager.py
└── tests/
    └── test_roma.py
```

Dependencies:
- networkx (task graphs)
- asyncio
- pydantic

## Minimal Code

```python
# backend/hyperagent/orchestrator/roma_planner.py
from dataclasses import dataclass
from enum import Enum
from typing import List, Dict, Optional
import asyncio

class TaskType(Enum):
    DESIGN = "design"
    CODE_GEN = "code_gen"
    AUDIT = "audit"
    OPTIMIZE = "optimize"
    DEPLOY = "deploy"

@dataclass
class Task:
    id: str
    type: TaskType
    prompt: str
    dependencies: List[str]
    model: str
    status: str = "pending"
    result: Optional[str] = None

class ROMAPlanner:
    """
    Reasoning, Orchestration, Memory, Action planner.
    Decomposes complex requests into executable task graphs.
    """
    
    MODEL_ROUTING = {
        TaskType.DESIGN: "gpt-4-turbo",
        TaskType.CODE_GEN: "claude-opus-4.5",
        TaskType.AUDIT: "claude-opus-4.5",
        TaskType.OPTIMIZE: "llama-3.1-405b",
        TaskType.DEPLOY: None  # No model, direct execution
    }
    
    async def plan(self, prompt: str, context: dict) -> List[Task]:
        """Decompose prompt into task graph"""
        
        # Use GPT-5 for planning
        plan_response = await self._call_planner(prompt)
        
        tasks = []
        for step in plan_response["steps"]:
            task = Task(
                id=step["id"],
                type=TaskType(step["type"]),
                prompt=step["prompt"],
                dependencies=step.get("depends_on", []),
                model=self.MODEL_ROUTING[TaskType(step["type"])]
            )
            tasks.append(task)
        
        return tasks
    
    async def execute(self, tasks: List[Task]) -> dict:
        """Execute task graph with parallel execution"""
        
        completed = {}
        pending = {t.id: t for t in tasks}
        
        while pending:
            # Find tasks with satisfied dependencies
            ready = [
                t for t in pending.values()
                if all(d in completed for d in t.dependencies)
            ]
            
            if not ready:
                raise RuntimeError("Circular dependency detected")
            
            # Execute ready tasks in parallel
            results = await asyncio.gather(*[
                self._execute_task(t, completed) for t in ready
            ])
            
            # Move to completed
            for task, result in zip(ready, results):
                task.result = result
                task.status = "complete"
                completed[task.id] = task
                del pending[task.id]
        
        return {
            "tasks": [t.__dict__ for t in completed.values()],
            "final_result": completed[tasks[-1].id].result
        }
    
    async def _call_planner(self, prompt: str) -> dict:
        """Call GPT-5 for task decomposition"""
        
        planner_prompt = f"""
        Decompose this request into tasks:
        {prompt}
        
        Return JSON:
        {{
            "steps": [
                {{"id": "1", "type": "design", "prompt": "...", "depends_on": []}},
                {{"id": "2", "type": "code_gen", "prompt": "...", "depends_on": ["1"]}},
                {{"id": "3", "type": "audit", "prompt": "...", "depends_on": ["2"]}}
            ]
        }}
        
        Task types: design, code_gen, audit, optimize, deploy
        """
        
        # Call OpenAI GPT-5
        response = await openai_client.chat.completions.create(
            model="gpt-5-turbo",
            messages=[{"role": "user", "content": planner_prompt}],
            response_format={"type": "json_object"}
        )
        
        return json.loads(response.choices[0].message.content)
    
    async def _execute_task(self, task: Task, context: dict) -> str:
        """Execute single task"""
        
        if task.type == TaskType.DEPLOY:
            return await self._deploy(task, context)
        
        # Build context from dependencies
        dep_context = "\n".join([
            f"Previous step ({d}): {context[d].result[:500]}"
            for d in task.dependencies
        ])
        
        full_prompt = f"{dep_context}\n\n{task.prompt}"
        
        return await model_router.call(task.model, full_prompt)
```

## Acceptance Criteria
- [ ] ROMAPlanner class implemented
- [ ] Task decomposition working
- [ ] Model routing by task type
- [ ] Parallel task execution
- [ ] Dependency resolution
- [ ] Circular dependency detection
- [ ] State maintained across tasks
- [ ] Context passed between tasks
- [ ] Error handling per task
- [ ] Unit tests for planner
- [ ] Integration test with real models
- [ ] 40% faster than single-model

## Dependencies
- TASK-S2-013: Claude Integration
- TASK-S2-015: Multi-Model Router

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes


