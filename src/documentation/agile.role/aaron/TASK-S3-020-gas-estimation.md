# TASK-S3-020: Gas Estimation Engine

## Metadata
- Assignee: Aaron
- Role: CTO/Project Architect
- Sprint: 3
- Priority: P1
- Status: BACKLOG
- Due Date: 2026-01-20
- Estimated Hours: 8h
- Actual Hours: 

## Problem
Users need accurate cost estimates before deployment. Without gas estimation:
- Unexpected deployment costs
- Failed transactions from insufficient gas
- Poor cost predictability
- User trust issues

Current state: No gas estimation. Users deploy blind.

## Goal
Build gas estimation engine for accurate pre-deployment cost calculation across all supported chains.

## Success Metrics
- Estimation within 10% of actual cost
- Sub-second estimation time
- Multi-chain support
- Gas price caching
- Clear cost breakdown

## Technical Scope

Files to create:
```
backend/hyperagent/
├── gas/
│   ├── __init__.py
│   ├── estimator.py
│   ├── price_oracle.py
│   └── chains.py
└── tests/
    └── test_gas.py
```

Dependencies:
- web3.py
- httpx
- redis (for price caching)

## Minimal Code

```python
# backend/hyperagent/gas/estimator.py
from dataclasses import dataclass
from typing import Optional
from decimal import Decimal
import asyncio

@dataclass
class GasEstimate:
    chain_id: int
    chain_name: str
    gas_limit: int
    gas_price_gwei: Decimal
    max_fee_gwei: Decimal
    priority_fee_gwei: Decimal
    estimated_cost_native: Decimal
    estimated_cost_usd: Decimal
    native_symbol: str

@dataclass
class ChainConfig:
    chain_id: int
    name: str
    native_symbol: str
    rpc_url: str
    is_eip1559: bool
    base_gas_multiplier: float = 1.2

class GasEstimator:
    """
    Multi-chain gas estimation engine.
    Provides accurate cost estimates before deployment.
    """
    
    CHAINS = {
        5000: ChainConfig(
            chain_id=5000,
            name="Mantle",
            native_symbol="MNT",
            rpc_url="${MANTLE_RPC}",
            is_eip1559=True,
            base_gas_multiplier=1.1
        ),
        5001: ChainConfig(
            chain_id=5001,
            name="Mantle Testnet",
            native_symbol="MNT",
            rpc_url="${MANTLE_TESTNET_RPC}",
            is_eip1559=True,
            base_gas_multiplier=1.1
        ),
        1: ChainConfig(
            chain_id=1,
            name="Ethereum",
            native_symbol="ETH",
            rpc_url="${ETH_RPC}",
            is_eip1559=True,
            base_gas_multiplier=1.2
        ),
        137: ChainConfig(
            chain_id=137,
            name="Polygon",
            native_symbol="MATIC",
            rpc_url="${POLYGON_RPC}",
            is_eip1559=True,
            base_gas_multiplier=1.3
        ),
    }
    
    def __init__(self, price_oracle, cache):
        self.price_oracle = price_oracle
        self.cache = cache
    
    async def estimate(
        self,
        bytecode: str,
        chain_id: int,
        constructor_args: Optional[bytes] = None
    ) -> GasEstimate:
        """Estimate deployment gas cost"""
        
        chain = self.CHAINS.get(chain_id)
        if not chain:
            raise ValueError(f"Unsupported chain: {chain_id}")
        
        # Get gas prices (cached)
        gas_prices = await self._get_gas_prices(chain)
        
        # Estimate gas limit
        gas_limit = await self._estimate_gas_limit(
            bytecode,
            constructor_args,
            chain
        )
        
        # Apply safety multiplier
        gas_limit = int(gas_limit * chain.base_gas_multiplier)
        
        # Calculate costs
        if chain.is_eip1559:
            cost_wei = gas_limit * (
                gas_prices["base_fee"] + gas_prices["priority_fee"]
            )
        else:
            cost_wei = gas_limit * gas_prices["gas_price"]
        
        cost_native = Decimal(cost_wei) / Decimal(10**18)
        
        # Get USD price
        native_usd = await self.price_oracle.get_price(chain.native_symbol)
        cost_usd = cost_native * native_usd
        
        return GasEstimate(
            chain_id=chain.chain_id,
            chain_name=chain.name,
            gas_limit=gas_limit,
            gas_price_gwei=Decimal(gas_prices.get("gas_price", 0)) / Decimal(10**9),
            max_fee_gwei=Decimal(gas_prices.get("base_fee", 0) + gas_prices.get("priority_fee", 0)) / Decimal(10**9),
            priority_fee_gwei=Decimal(gas_prices.get("priority_fee", 0)) / Decimal(10**9),
            estimated_cost_native=cost_native,
            estimated_cost_usd=cost_usd,
            native_symbol=chain.native_symbol
        )
    
    async def estimate_multi(
        self,
        bytecode: str,
        chain_ids: list[int],
        constructor_args: Optional[bytes] = None
    ) -> list[GasEstimate]:
        """Estimate for multiple chains"""
        
        tasks = [
            self.estimate(bytecode, chain_id, constructor_args)
            for chain_id in chain_ids
        ]
        
        return await asyncio.gather(*tasks)
    
    async def _get_gas_prices(self, chain: ChainConfig) -> dict:
        """Get current gas prices with caching"""
        
        cache_key = f"gas_price:{chain.chain_id}"
        cached = await self.cache.get(cache_key)
        
        if cached:
            return cached
        
        # Fetch from RPC
        from web3 import AsyncWeb3
        w3 = AsyncWeb3(AsyncWeb3.AsyncHTTPProvider(chain.rpc_url))
        
        if chain.is_eip1559:
            block = await w3.eth.get_block("latest")
            base_fee = block.get("baseFeePerGas", 0)
            priority_fee = await w3.eth.max_priority_fee
            
            prices = {
                "base_fee": base_fee,
                "priority_fee": priority_fee,
                "gas_price": base_fee + priority_fee
            }
        else:
            gas_price = await w3.eth.gas_price
            prices = {"gas_price": gas_price}
        
        # Cache for 15 seconds
        await self.cache.set(cache_key, prices, ttl=15)
        
        return prices
    
    async def _estimate_gas_limit(
        self,
        bytecode: str,
        constructor_args: Optional[bytes],
        chain: ChainConfig
    ) -> int:
        """Estimate gas limit for deployment"""
        
        from web3 import AsyncWeb3
        w3 = AsyncWeb3(AsyncWeb3.AsyncHTTPProvider(chain.rpc_url))
        
        # Build deployment data
        data = bytecode
        if constructor_args:
            data += constructor_args.hex()
        
        # Estimate
        try:
            estimate = await w3.eth.estimate_gas({
                "data": data,
                "from": "0x0000000000000000000000000000000000000001"
            })
            return estimate
        except Exception:
            # Fallback: calculate from bytecode size
            # ~200 gas per byte + 21000 base
            return 21000 + (len(bytes.fromhex(bytecode[2:])) * 200)
```

```python
# backend/hyperagent/gas/price_oracle.py
import httpx
from decimal import Decimal
from typing import Dict

class PriceOracle:
    """Fetch token prices from CoinGecko"""
    
    COINGECKO_IDS = {
        "ETH": "ethereum",
        "MNT": "mantle",
        "MATIC": "matic-network",
        "AVAX": "avalanche-2",
        "SOL": "solana",
    }
    
    def __init__(self, cache):
        self.cache = cache
        self.base_url = "https://api.coingecko.com/api/v3"
    
    async def get_price(self, symbol: str) -> Decimal:
        """Get USD price for native token"""
        
        cache_key = f"price:{symbol}"
        cached = await self.cache.get(cache_key)
        
        if cached:
            return Decimal(cached["usd"])
        
        coin_id = self.COINGECKO_IDS.get(symbol)
        if not coin_id:
            return Decimal("0")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/simple/price",
                params={
                    "ids": coin_id,
                    "vs_currencies": "usd"
                }
            )
            data = response.json()
            price = data.get(coin_id, {}).get("usd", 0)
        
        # Cache for 5 minutes
        await self.cache.set(cache_key, {"usd": str(price)}, ttl=300)
        
        return Decimal(str(price))
    
    async def get_prices_batch(self, symbols: list[str]) -> Dict[str, Decimal]:
        """Get prices for multiple tokens"""
        
        coin_ids = [
            self.COINGECKO_IDS[s] for s in symbols
            if s in self.COINGECKO_IDS
        ]
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/simple/price",
                params={
                    "ids": ",".join(coin_ids),
                    "vs_currencies": "usd"
                }
            )
            data = response.json()
        
        return {
            symbol: Decimal(str(data.get(self.COINGECKO_IDS[symbol], {}).get("usd", 0)))
            for symbol in symbols
        }
```

## Acceptance Criteria
- [ ] GasEstimator class implemented
- [ ] Multi-chain configuration
- [ ] EIP-1559 support
- [ ] Legacy gas price support
- [ ] Gas limit estimation
- [ ] Safety multiplier applied
- [ ] Price oracle integration
- [ ] Price caching (5 min)
- [ ] Gas price caching (15 sec)
- [ ] Multi-chain batch estimation
- [ ] Estimation within 10% accuracy
- [ ] Sub-second response time
- [ ] Unit tests passing

## Dependencies
- TASK-S1-005: RPC Provider Setup
- TASK-S2-017: Cache Layer (Redis)

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes


