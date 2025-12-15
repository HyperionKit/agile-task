# TASK-M4-057: Retry Logic & Status States

## Metadata
- Assignee: Aaron
- Role: CTO/Project Architect
- Month: 4 (January 2026)
- Priority: P1
- Status: BACKLOG
- Due Date: 2026-01-15
- Estimated Hours: 12h
- Actual Hours: 

## Problem
Deployment pipeline lacks retry logic and clear status states. Without this:
- Failed deploys hard to debug
- No automatic retry on transient failures
- Status unclear (pending/failed/success)
- Users confused about deployment state

Current state: Single attempt deployments. No retry. Vague status messages.

## Goal
Add retry logic, clear status states in dashboard, and consistent logs in backend for each deploy so failed deploys are easy to debug.

## Success Metrics
- Retry logic implemented (3 attempts)
- Clear status states (pending, retrying, success, failed)
- Consistent logging per deployment
- Failed deploy debugging time under 5 minutes
- 80%+ success rate after retries

## Technical Scope

Files to create/modify:
```
backend/
├── services/
│   └── deployment/
│       ├── retry_manager.py
│       ├── status_tracker.py
│       └── logger.py
└── api/
    └── deployments.py
```

Dependencies:
- Structured logging
- Redis for status tracking

## Minimal Code

```python
# backend/services/deployment/retry_manager.py
from enum import Enum
from typing import Optional
import asyncio

class DeploymentStatus(Enum):
    PENDING = "pending"
    RETRYING = "retrying"
    SUCCESS = "success"
    FAILED = "failed"
    CANCELLED = "cancelled"

class RetryManager:
    def __init__(self, max_retries: int = 3, backoff_seconds: int = 5):
        self.max_retries = max_retries
        self.backoff = backoff_seconds
    
    async def deploy_with_retry(
        self,
        deployment_id: str,
        deploy_func,
        *args,
        **kwargs
    ) -> dict:
        """Deploy with automatic retry on failure"""
        
        last_error = None
        
        for attempt in range(self.max_retries):
            try:
                # Update status
                await self.update_status(
                    deployment_id,
                    DeploymentStatus.RETRYING if attempt > 0 else DeploymentStatus.PENDING,
                    attempt + 1
                )
                
                # Attempt deployment
                result = await deploy_func(*args, **kwargs)
                
                # Success
                await self.update_status(
                    deployment_id,
                    DeploymentStatus.SUCCESS,
                    attempt + 1
                )
                
                return {
                    "status": "success",
                    "result": result,
                    "attempts": attempt + 1
                }
                
            except Exception as e:
                last_error = e
                
                # Log error
                await self.log_error(deployment_id, attempt + 1, str(e))
                
                # Wait before retry (exponential backoff)
                if attempt < self.max_retries - 1:
                    wait_time = self.backoff * (2 ** attempt)
                    await asyncio.sleep(wait_time)
        
        # All retries failed
        await self.update_status(
            deployment_id,
            DeploymentStatus.FAILED,
            self.max_retries
        )
        
        raise DeploymentError(
            f"Deployment failed after {self.max_retries} attempts",
            last_error
        )
```

## Acceptance Criteria
- [ ] Retry manager implemented
- [ ] Status enum defined
- [ ] 3 retry attempts with backoff
- [ ] Status updates in real-time
- [ ] Consistent logging per attempt
- [ ] Error messages clear
- [ ] Dashboard shows retry status
- [ ] Unit tests for retry logic

## Dependencies
- TASK-M4-056: Deployment Pipeline Stability

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes
Month 4 reliability improvement.

