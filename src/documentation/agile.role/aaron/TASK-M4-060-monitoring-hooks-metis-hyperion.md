# TASK-M4-060: Monitoring Hooks (Metis & Hyperion)

## Metadata
- Assignee: Aaron
- Role: CTO/Project Architect
- Month: 4 (January 2026)
- Priority: P1
- Status: BACKLOG
- Due Date: 2026-01-20
- Estimated Hours: 10h
- Actual Hours: 

## Problem
No analytics for Metis and Hyperion deployments. Without monitoring:
- Cannot track success rates
- Template usage unknown
- Rollback actions not logged
- No data for improvements

## Goal
Add simple monitoring hooks or analytics for Metis and Hyperion, tracking daily counts of deploy attempts, success rates, rollback actions, and most used templates.

## Success Metrics
- Daily deploy counts tracked
- Success rate calculated
- Rollback actions logged
- Template usage tracked
- Rough dashboard operational
- Data queryable via API

## Technical Scope

Files to create/modify:
```
backend/
├── services/
│   └── analytics/
│       ├── deployment_tracker.py
│       └── metrics_collector.py
└── api/
    └── analytics.py
```

Dependencies:
- PostgreSQL
- Redis

## Minimal Code

```python
# backend/services/analytics/deployment_tracker.py
from datetime import datetime, timedelta
from typing import Dict, List
import asyncpg

class DeploymentTracker:
    def __init__(self, db_pool: asyncpg.Pool):
        self.db = db_pool
    
    async def track_deployment(
        self,
        deployment_id: str,
        network: str,
        template: str,
        status: str
    ):
        """Track deployment attempt"""
        await self.db.execute("""
            INSERT INTO deployments (
                id, network, template, status, created_at
            ) VALUES ($1, $2, $3, $4, NOW())
        """, deployment_id, network, template, status)
    
    async def get_daily_stats(
        self,
        network: str,
        date: datetime
    ) -> Dict:
        """Get daily statistics for network"""
        start = date.replace(hour=0, minute=0, second=0)
        end = start + timedelta(days=1)
        
        row = await self.db.fetchrow("""
            SELECT
                COUNT(*) as total_attempts,
                COUNT(*) FILTER (WHERE status = 'success') as successes,
                COUNT(*) FILTER (WHERE status = 'failed') as failures,
                COUNT(*) FILTER (WHERE status = 'rolled_back') as rollbacks
            FROM deployments
            WHERE network = $1
            AND created_at >= $2
            AND created_at < $3
        """, network, start, end)
        
        return {
            "network": network,
            "date": date.isoformat(),
            "total_attempts": row["total_attempts"],
            "successes": row["successes"],
            "failures": row["failures"],
            "rollbacks": row["rollbacks"],
            "success_rate": row["successes"] / row["total_attempts"] if row["total_attempts"] > 0 else 0
        }
    
    async def get_template_usage(self, network: str) -> List[Dict]:
        """Get most used templates"""
        rows = await self.db.fetch("""
            SELECT
                template,
                COUNT(*) as usage_count,
                COUNT(*) FILTER (WHERE status = 'success') as success_count
            FROM deployments
            WHERE network = $1
            AND created_at >= NOW() - INTERVAL '30 days'
            GROUP BY template
            ORDER BY usage_count DESC
            LIMIT 10
        """, network)
        
        return [
            {
                "template": row["template"],
                "usage_count": row["usage_count"],
                "success_count": row["success_count"]
            }
            for row in rows
        ]
```

## Acceptance Criteria
- [ ] Deployment tracking implemented
- [ ] Daily stats calculated
- [ ] Success rate tracked
- [ ] Rollback actions logged
- [ ] Template usage tracked
- [ ] API endpoint for stats
- [ ] Dashboard displays metrics
- [ ] Data persisted to database

## Dependencies
- TASK-M4-056: Deployment Pipeline Stability

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes
Month 4 reliability monitoring.

