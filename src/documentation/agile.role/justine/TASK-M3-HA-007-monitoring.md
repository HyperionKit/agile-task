# TASK-M3-HA-007: Real-Time Monitoring

## Metadata
- Assignee: Justine
- Role: CPOO/Project Architect
- Month: 3 (December 2025)
- Priority: P1
- Status: BACKLOG
- Due Date: 2025-12-22
- Estimated Hours: 8h
- Actual Hours: 

## Problem
Real-time monitoring not implemented. Without monitoring:
- No TVL tracking
- Missing event webhooks
- No analytics
- Poor observability

Current state: Monitoring not set up.

## Goal
Implement real-time monitoring: Moralis streams for deployment events, Dune queries for TVL tracking, dashboard updates.

## Success Metrics
- Moralis stream creation working
- Webhook event handling functional
- Dune TVL queries working
- Dashboard updates real-time
- Documentation complete

## Technical Scope

Files to create/modify:
```
backend/
├── hyperagent/
│   └── monitoring/
│       ├── moralis_streams.py
│       ├── dune_analytics.py
│       └── tvl_tracker.py
```

Dependencies:
- Moralis API
- Dune API

## Minimal Code

```python
# backend/hyperagent/monitoring/monitor.py
from moralis import streams_api
import aiohttp

class HyperAgentMonitor:
    def __init__(self):
        self.moralis_streams = StreamsAPI(
            api_key=os.getenv("MORALIS_API_KEY")
        )
        self.dune = DuneClient(api_key=os.getenv("DUNE_API_KEY"))

    async def setup_deployment_webhook(self, contract_address: str, chain: str):
        """
        Create Moralis stream for deployment events
        """
        stream = await self.moralis_streams.create_stream({
            "chains": [self.chain_id_from_name(chain)],
            "description": f"Monitor {contract_address} on {chain}",
            "webhookUrl": f"{WEBHOOK_BASE}/deployments",
            "includeContractLogs": True,
            "includeContractNativeTxs": True,
            "topic0": [
                "Transfer(address,address,uint256)",
                "Swap(address,uint256,uint256,uint256,uint256,address)"
            ]
        })

        return stream

    async def track_tvl(self, contracts: Dict[str, str], chain: str):
        """
        Track TVL using Dune SQL
        """
        dune_query = f"""
        SELECT
            '{chain}' as chain,
            COUNT(DISTINCT holder) as unique_holders,
            SUM(balance) as total_tvl,
            NOW() as timestamp
        FROM erc20_balances
        WHERE token_address IN ({','.join(f"'{addr}'" for addr in contracts.values())})
            AND chain = '{chain}'
        GROUP BY 1, 4
        """

        result = await self.dune.execute_query(dune_query)
        return result

    async def monitor_deployed_app(
        self,
        deployment_id: str,
        contracts: Dict[str, str],
        chain: str
    ):
        """
        Start monitoring newly deployed app
        """
        stream = await self.setup_deployment_webhook(
            list(contracts.values())[0],
            chain
        )

        while True:
            tvl_data = await self.track_tvl(contracts, chain)
            
            await self.emit_to_dashboard("tvl_update", {
                "deploymentId": deployment_id,
                "tvl": tvl_data,
                "timestamp": datetime.now()
            })

            await asyncio.sleep(300)
```

## Acceptance Criteria
- [ ] Moralis stream creation
- [ ] Webhook event handling
- [ ] Dune TVL queries
- [ ] Dashboard updates real-time
- [ ] Documentation complete

## Dependencies
- TASK-M3-HA-006: Foundry Deployment Integration

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes

