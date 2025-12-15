# TASK-M3-SEC-007: Economic DoS Rate Limiting

## Metadata
- Assignee: Aaron
- Role: CTO/Project Architect
- Month: 3 (December 2025)
- Priority: P2
- Status: BACKLOG
- Due Date: 2025-12-28
- Estimated Hours: 8h
- Actual Hours: 

## Problem
No economic DoS protection. Without protection:
- Griefing attacks possible
- Credit system drained
- Low-quality builds spam
- Economic waste

Current state: No rate limiting for builds.

## Goal
Implement economic DoS rate limiting to prevent griefing attacks and credit system abuse.

## Success Metrics
- Rate limiting implemented
- Griefing attacks prevented
- Credit system protected
- Low-quality builds blocked
- Economic waste minimized

## Technical Scope

Files to create/modify:
```
backend/
├── hyperagent/
│   └── security/
│       └── rate_limiter.py
```

Dependencies:
- Redis
- Database

## Minimal Code

```python
# backend/hyperagent/security/rate_limiter.py
from datetime import datetime, timedelta
from typing import Optional
import redis

class RateLimiter:
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.FREE_TIER_LIMIT = 50  # builds per day
        self.FAILURE_THRESHOLD = 0.8  # 80% failure rate
    
    async def check_user_limits(self, user_id: str) -> bool:
        """Check if user exceeds rate limits"""
        
        # Count builds today
        builds_today = await self._count_builds(user_id, hours=24)
        if builds_today > self.FREE_TIER_LIMIT:
            raise LimitError("DAILY_LIMIT_EXCEEDED")
        
        # Check failure rate
        failed_builds = await self._count_failed_builds(user_id, hours=24)
        if builds_today > 0:
            failure_rate = failed_builds / builds_today
            if failure_rate > self.FAILURE_THRESHOLD:
                raise LimitError("LOW_QUALITY_THRESHOLD")
        
        return True
    
    async def _count_builds(self, user_id: str, hours: int) -> int:
        """Count builds in last N hours"""
        key = f"builds:{user_id}:{datetime.now().strftime('%Y-%m-%d')}"
        return await self.redis.get(key) or 0
    
    async def _count_failed_builds(self, user_id: str, hours: int) -> int:
        """Count failed builds in last N hours"""
        key = f"failed_builds:{user_id}:{datetime.now().strftime('%Y-%m-%d')}"
        return await self.redis.get(key) or 0
```

## Acceptance Criteria
- [ ] Rate limiting implemented
- [ ] Griefing attacks prevented
- [ ] Credit system protected
- [ ] Low-quality builds blocked
- [ ] Economic waste minimized

## Dependencies
- TASK-M1-OVERDUE-005: Structured Logging

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes

