# TASK-M6-079: Telemetry Dashboard

## Metadata
- Assignee: Aaron
- Role: CTO/Project Architect
- Month: 6 (March 2026)
- Priority: P1
- Status: BACKLOG
- Due Date: 2026-03-20
- Estimated Hours: 12h
- Actual Hours: 

## Problem
No visibility into platform usage and metrics. Without telemetry:
- Cannot track active projects
- Deployment counts unknown
- Network split unclear
- Template adoption invisible
- No data for reporting

## Goal
Add telemetry and simple dashboards that show active projects, number of deployments, network split, and template adoption for Metis and Hyperion, even if the dashboard is only internal.

## Success Metrics
- Telemetry dashboard operational
- Active projects tracked
- Deployment counts displayed
- Network split visible
- Template adoption shown
- Data queryable
- Internal dashboard functional

## Technical Scope

Files to create/modify:
```
backend/
├── services/
│   └── telemetry/
│       ├── dashboard.py
│       └── metrics_collector.py
frontend/
└── app/
    └── admin/
        └── telemetry/
            └── page.tsx
```

Dependencies:
- Analytics database
- Dashboard framework

## Minimal Code

```python
# backend/services/telemetry/dashboard.py
from datetime import datetime, timedelta
from typing import Dict, List
import asyncpg

class TelemetryDashboard:
    def __init__(self, db_pool: asyncpg.Pool):
        self.db = db_pool
    
    async def get_active_projects(
        self,
        network: str,
        days: int = 30
    ) -> int:
        """Count active projects in last N days"""
        cutoff = datetime.now() - timedelta(days=days)
        
        count = await self.db.fetchval("""
            SELECT COUNT(DISTINCT project_id)
            FROM deployments
            WHERE network = $1
            AND created_at >= $2
        """, network, cutoff)
        
        return count
    
    async def get_deployment_stats(
        self,
        network: str
    ) -> Dict:
        """Get deployment statistics"""
        stats = await self.db.fetchrow("""
            SELECT
                COUNT(*) as total_deployments,
                COUNT(*) FILTER (WHERE status = 'success') as successful,
                COUNT(*) FILTER (WHERE status = 'failed') as failed,
                COUNT(DISTINCT project_id) as unique_projects
            FROM deployments
            WHERE network = $1
            AND created_at >= NOW() - INTERVAL '30 days'
        """, network)
        
        return {
            "network": network,
            "total_deployments": stats["total_deployments"],
            "successful": stats["successful"],
            "failed": stats["failed"],
            "unique_projects": stats["unique_projects"],
            "success_rate": stats["successful"] / stats["total_deployments"] if stats["total_deployments"] > 0 else 0
        }
    
    async def get_network_split(self) -> Dict:
        """Get deployment split across networks"""
        split = await self.db.fetch("""
            SELECT
                network,
                COUNT(*) as deployments
            FROM deployments
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY network
        """)
        
        total = sum(row["deployments"] for row in split)
        
        return {
            "networks": {
                row["network"]: {
                    "deployments": row["deployments"],
                    "percentage": (row["deployments"] / total * 100) if total > 0 else 0
                }
                for row in split
            },
            "total": total
        }
    
    async def get_template_adoption(self, network: str) -> List[Dict]:
        """Get template adoption rates"""
        adoption = await self.db.fetch("""
            SELECT
                template,
                COUNT(*) as usage_count,
                COUNT(*) FILTER (WHERE status = 'success') as success_count
            FROM deployments
            WHERE network = $1
            AND created_at >= NOW() - INTERVAL '30 days'
            GROUP BY template
            ORDER BY usage_count DESC
        """, network)
        
        return [
            {
                "template": row["template"],
                "usage_count": row["usage_count"],
                "success_count": row["success_count"],
                "adoption_rate": row["usage_count"] / (await self.get_total_deployments(network)) if await self.get_total_deployments(network) > 0 else 0
            }
            for row in adoption
        ]
```

## Acceptance Criteria
- [ ] Telemetry dashboard implemented
- [ ] Active projects tracked
- [ ] Deployment stats displayed
- [ ] Network split calculated
- [ ] Template adoption shown
- [ ] Internal dashboard functional
- [ ] Data queryable via API
- [ ] Charts/visualizations included

## Dependencies
- TASK-M4-060: Monitoring Hooks (Metis & Hyperion)

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes
Month 6 analytics milestone.

