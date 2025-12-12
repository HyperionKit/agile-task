# TASK-S1-005: RPC Provider Setup

## Metadata
- Assignee: Aaron
- Role: CTO/Project Architect
- Sprint: 1
- Priority: P1
- Status: BACKLOG
- Due Date: 2025-12-22
- Estimated Hours: 4h
- Actual Hours: 

## Problem
HyperKit deploys to 100+ chains. Each chain needs reliable RPC access. Without provider pooling:
- Single provider outage blocks all deployments
- Rate limiting causes failed transactions
- No fallback for slow responses
- High costs from inefficient routing

Current state: No RPC infrastructure. Cannot deploy to any blockchain.

## Goal
Configure RPC provider pooling with automatic failover. This enables:
- 99.9% RPC availability
- Automatic retry on failure
- Load balancing across providers
- Cost optimization through smart routing

## Success Metrics
- RPC availability above 99.9%
- Failover switches in under 2 seconds
- Average RPC latency under 200ms
- Zero failed deploys due to RPC issues
- Rate limit errors under 0.1%

## Technical Scope

Files to create:
```
backend/
├── blockchain/
│   ├── rpc_pool.py
│   ├── providers/
│   │   ├── alchemy.py
│   │   ├── quicknode.py
│   │   └── helius.py
│   └── health_check.py
├── config/
│   └── chains.py
```

Dependencies:
- Alchemy SDK
- QuickNode
- Helius (Solana)
- web3.py
- httpx (async HTTP)

Integration points:
- Contract deployment service
- Transaction monitoring
- Gas estimation

## Minimal Code

```python
# blockchain/rpc_pool.py
from dataclasses import dataclass
from typing import Optional
import asyncio
import httpx

@dataclass
class RPCProvider:
    name: str
    url: str
    priority: int
    rate_limit: int
    healthy: bool = True
    last_check: float = 0

class RPCPool:
    def __init__(self, chain: str):
        self.chain = chain
        self.providers: list[RPCProvider] = []
        self.current_index = 0
        
    def add_provider(self, provider: RPCProvider):
        self.providers.append(provider)
        self.providers.sort(key=lambda p: p.priority)
    
    async def get_provider(self) -> RPCProvider:
        """Get healthy provider with failover"""
        for provider in self.providers:
            if provider.healthy:
                return provider
        
        # All unhealthy, try primary anyway
        return self.providers[0]
    
    async def call(self, method: str, params: list) -> dict:
        """Make RPC call with automatic retry"""
        max_retries = 3
        last_error = None
        
        for attempt in range(max_retries):
            provider = await self.get_provider()
            
            try:
                async with httpx.AsyncClient(timeout=10) as client:
                    response = await client.post(
                        provider.url,
                        json={
                            "jsonrpc": "2.0",
                            "id": 1,
                            "method": method,
                            "params": params
                        }
                    )
                    result = response.json()
                    
                    if "error" in result:
                        raise RPCError(result["error"])
                    
                    return result["result"]
                    
            except Exception as e:
                last_error = e
                provider.healthy = False
                await self.schedule_health_check(provider)
                continue
        
        raise RPCError(f"All providers failed: {last_error}")
    
    async def schedule_health_check(self, provider: RPCProvider):
        """Re-check provider health after cooldown"""
        await asyncio.sleep(30)
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                response = await client.post(
                    provider.url,
                    json={
                        "jsonrpc": "2.0",
                        "id": 1,
                        "method": "eth_blockNumber",
                        "params": []
                    }
                )
                if response.status_code == 200:
                    provider.healthy = True
        except:
            pass
```

```python
# config/chains.py
CHAIN_CONFIG = {
    "mantle": {
        "chain_id": 5000,
        "providers": [
            {
                "name": "alchemy",
                "url": os.getenv("ALCHEMY_MANTLE_URL"),
                "priority": 1,
                "rate_limit": 300
            },
            {
                "name": "quicknode",
                "url": os.getenv("QUICKNODE_MANTLE_URL"),
                "priority": 2,
                "rate_limit": 250
            }
        ],
        "explorer": "https://mantlescan.info"
    },
    "solana": {
        "cluster": "mainnet-beta",
        "providers": [
            {
                "name": "helius",
                "url": os.getenv("HELIUS_URL"),
                "priority": 1,
                "rate_limit": 100
            },
            {
                "name": "quicknode",
                "url": os.getenv("QUICKNODE_SOLANA_URL"),
                "priority": 2,
                "rate_limit": 100
            }
        ]
    }
}
```

```python
# blockchain/providers/alchemy.py
from alchemy import Alchemy, Network

class AlchemyProvider:
    def __init__(self, api_key: str, network: Network):
        self.client = Alchemy(api_key=api_key, network=network)
    
    async def get_balance(self, address: str) -> int:
        return await self.client.core.get_balance(address)
    
    async def send_transaction(self, tx: dict) -> str:
        return await self.client.core.send_transaction(tx)
    
    async def get_gas_price(self) -> int:
        return await self.client.core.get_gas_price()
```

## Acceptance Criteria
- [ ] Alchemy account configured for EVM chains
- [ ] QuickNode account configured as backup
- [ ] Helius account configured for Solana
- [ ] RPC pooling logic implemented
- [ ] Automatic failover working (under 2 seconds)
- [ ] Health check endpoint for each provider
- [ ] Rate limiting respected
- [ ] API keys stored in environment variables
- [ ] Mantle testnet connectivity verified
- [ ] Solana devnet connectivity verified

## Dependencies
- TASK-S1-001: Setup GitHub Monorepo

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes

