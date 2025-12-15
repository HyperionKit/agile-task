# TASK-M4-056: Deployment Pipeline Stability

## Metadata
- Assignee: Aaron
- Role: CTO/Project Architect
- Month: 4 (January 2026)
- Priority: P0
- Status: BACKLOG
- Due Date: 2026-01-20
- Estimated Hours: 16h
- Actual Hours: 

## Problem
Deployment pipeline to Metis and Hyperion lacks reliability. Without stability:
- Failed deploys hard to debug
- No retry mechanism
- Status states unclear
- Logs inconsistent

Current state: Basic deployment. No retry, poor logging.

## Goal
Stabilize deployment pipeline with retry logic, clear status states, and consistent backend logging for Metis and Hyperion.

## Success Metrics
- 80%+ deployment success rate
- Clear status states in dashboard
- Consistent logs for debugging
- Retry mechanism working
- Failed deploys easily diagnosable

## Technical Scope

Files to modify/create:
```
backend/hyperagent/
├── deployment/
│   ├── pipeline.py
│   ├── retry.py
│   ├── status.py
│   └── logger.py
```

Dependencies:
- tenacity (retry library)
- structlog

## Minimal Code

```python
# backend/hyperagent/deployment/pipeline.py
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, List
import asyncio
from datetime import datetime

class DeploymentStatus(Enum):
    PENDING = "pending"
    COMPILING = "compiling"
    COMPILED = "compiled"
    ESTIMATING_GAS = "estimating_gas"
    SUBMITTING = "submitting"
    SUBMITTED = "submitted"
    CONFIRMING = "confirming"
    CONFIRMED = "confirmed"
    VERIFYING = "verifying"
    VERIFIED = "verified"
    COMPLETE = "complete"
    FAILED = "failed"
    RETRYING = "retrying"

@dataclass
class DeploymentState:
    build_id: str
    chain_id: int
    status: DeploymentStatus
    tx_hash: Optional[str] = None
    contract_address: Optional[str] = None
    error: Optional[str] = None
    retry_count: int = 0
    started_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    logs: List[str] = field(default_factory=list)

class DeploymentPipeline:
    """
    Stable deployment pipeline for Metis and Hyperion.
    Includes retry logic, status tracking, and consistent logging.
    """
    
    MAX_RETRIES = 3
    RETRY_DELAYS = [5, 15, 30]  # seconds
    
    def __init__(self, deployer, logger, state_store):
        self.deployer = deployer
        self.logger = logger
        self.state_store = state_store
    
    async def deploy(
        self,
        build_id: str,
        bytecode: str,
        abi: dict,
        chain_id: int,
        constructor_args: Optional[tuple] = None
    ) -> DeploymentState:
        """Execute deployment with retry and status tracking"""
        
        state = DeploymentState(
            build_id=build_id,
            chain_id=chain_id,
            status=DeploymentStatus.PENDING
        )
        
        await self._update_state(state)
        
        for attempt in range(self.MAX_RETRIES + 1):
            try:
                if attempt > 0:
                    state.status = DeploymentStatus.RETRYING
                    state.retry_count = attempt
                    await self._update_state(state)
                    
                    delay = self.RETRY_DELAYS[min(attempt - 1, len(self.RETRY_DELAYS) - 1)]
                    self._log(state, f"Retrying in {delay}s (attempt {attempt + 1}/{self.MAX_RETRIES + 1})")
                    await asyncio.sleep(delay)
                
                # Step 1: Compile check
                state.status = DeploymentStatus.COMPILING
                await self._update_state(state)
                
                compile_result = await self._verify_bytecode(bytecode)
                if not compile_result:
                    raise DeploymentError("Bytecode verification failed")
                
                state.status = DeploymentStatus.COMPILED
                await self._update_state(state)
                
                # Step 2: Gas estimation
                state.status = DeploymentStatus.ESTIMATING_GAS
                await self._update_state(state)
                
                gas_estimate = await self.deployer.estimate_gas(
                    bytecode, constructor_args, chain_id
                )
                self._log(state, f"Gas estimate: {gas_estimate}")
                
                # Step 3: Submit transaction
                state.status = DeploymentStatus.SUBMITTING
                await self._update_state(state)
                
                tx_hash = await self.deployer.submit_deployment(
                    bytecode=bytecode,
                    abi=abi,
                    chain_id=chain_id,
                    constructor_args=constructor_args,
                    gas_limit=int(gas_estimate * 1.2)  # 20% buffer
                )
                
                state.tx_hash = tx_hash
                state.status = DeploymentStatus.SUBMITTED
                await self._update_state(state)
                self._log(state, f"Transaction submitted: {tx_hash}")
                
                # Step 4: Wait for confirmation
                state.status = DeploymentStatus.CONFIRMING
                await self._update_state(state)
                
                receipt = await self.deployer.wait_for_confirmation(
                    tx_hash, chain_id, timeout=120
                )
                
                if receipt["status"] != 1:
                    raise DeploymentError(f"Transaction reverted: {tx_hash}")
                
                state.contract_address = receipt["contractAddress"]
                state.status = DeploymentStatus.CONFIRMED
                await self._update_state(state)
                self._log(state, f"Contract deployed: {state.contract_address}")
                
                # Step 5: Verify contract
                state.status = DeploymentStatus.VERIFYING
                await self._update_state(state)
                
                try:
                    await self.deployer.verify_contract(
                        address=state.contract_address,
                        chain_id=chain_id,
                        source_code=bytecode,  # Would be actual source
                        abi=abi
                    )
                    state.status = DeploymentStatus.VERIFIED
                    self._log(state, "Contract verified on explorer")
                except Exception as e:
                    self._log(state, f"Verification failed (non-blocking): {e}")
                
                # Success
                state.status = DeploymentStatus.COMPLETE
                await self._update_state(state)
                self._log(state, "Deployment complete")
                
                return state
                
            except DeploymentError as e:
                self._log(state, f"Deployment error: {e}")
                state.error = str(e)
                
                if attempt < self.MAX_RETRIES:
                    continue
                
                state.status = DeploymentStatus.FAILED
                await self._update_state(state)
                return state
                
            except Exception as e:
                self._log(state, f"Unexpected error: {e}")
                state.error = str(e)
                
                if attempt < self.MAX_RETRIES:
                    continue
                
                state.status = DeploymentStatus.FAILED
                await self._update_state(state)
                return state
        
        return state
    
    async def _update_state(self, state: DeploymentState):
        """Update state in store and notify listeners"""
        state.updated_at = datetime.utcnow()
        await self.state_store.save(state)
        
        # Publish status update for WebSocket
        await self._publish_status(state)
    
    def _log(self, state: DeploymentState, message: str):
        """Add log entry with timestamp"""
        entry = f"[{datetime.utcnow().isoformat()}] {message}"
        state.logs.append(entry)
        
        self.logger.info(
            "deployment_log",
            build_id=state.build_id,
            chain_id=state.chain_id,
            status=state.status.value,
            message=message
        )
    
    async def _verify_bytecode(self, bytecode: str) -> bool:
        """Verify bytecode is valid"""
        if not bytecode or not bytecode.startswith("0x"):
            return False
        if len(bytecode) < 10:
            return False
        return True
    
    async def _publish_status(self, state: DeploymentState):
        """Publish status update to WebSocket channel"""
        await self.state_store.publish(
            f"deployment:{state.build_id}",
            {
                "status": state.status.value,
                "chain_id": state.chain_id,
                "tx_hash": state.tx_hash,
                "contract_address": state.contract_address,
                "error": state.error,
                "retry_count": state.retry_count
            }
        )


class DeploymentError(Exception):
    """Deployment-specific error"""
    pass
```

```python
# backend/hyperagent/deployment/retry.py
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type
)
import httpx

class RetryableDeployer:
    """Deployer with built-in retry logic for transient failures"""
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=30),
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.NetworkError))
    )
    async def send_transaction(self, tx_data: dict, rpc_url: str) -> str:
        """Send transaction with retry on network errors"""
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                rpc_url,
                json={
                    "jsonrpc": "2.0",
                    "method": "eth_sendRawTransaction",
                    "params": [tx_data["signed_tx"]],
                    "id": 1
                }
            )
            result = response.json()
            
            if "error" in result:
                raise DeploymentError(result["error"]["message"])
            
            return result["result"]
    
    @retry(
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=2, min=2, max=60),
        retry=retry_if_exception_type((httpx.TimeoutException,))
    )
    async def get_receipt(self, tx_hash: str, rpc_url: str) -> dict:
        """Get transaction receipt with retry"""
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                rpc_url,
                json={
                    "jsonrpc": "2.0",
                    "method": "eth_getTransactionReceipt",
                    "params": [tx_hash],
                    "id": 1
                }
            )
            result = response.json()
            
            if result.get("result") is None:
                raise PendingTransactionError("Transaction not yet mined")
            
            return result["result"]


class PendingTransactionError(Exception):
    """Transaction still pending"""
    pass
```

## Acceptance Criteria
- [ ] DeploymentPipeline class implemented
- [ ] Clear status states (12 states)
- [ ] Retry logic with exponential backoff
- [ ] Max 3 retries per deployment
- [ ] Consistent logging with timestamps
- [ ] State persistence in store
- [ ] WebSocket status updates
- [ ] Gas estimation with buffer
- [ ] Transaction confirmation tracking
- [ ] Contract verification (non-blocking)
- [ ] 80%+ success rate on testnets
- [ ] Failed deploys have clear logs
- [ ] Integration tests passing

## Dependencies
- TASK-S1-005: RPC Provider Setup
- TASK-S3-018: ERC-4337 Deployment

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes
Month 4 Hyperion Milestone - Reliability

