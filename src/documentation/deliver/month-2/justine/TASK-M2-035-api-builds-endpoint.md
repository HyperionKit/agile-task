# TASK-M2-035: API /builds Endpoint

## Metadata
- Assignee: Justine
- Role: CPOO/Product Lead
- Month: 2 (November 2025)
- Priority: P0
- Status: DONE
- Due Date: 2025-11-07
- Completed Date: 2025-11-07
- Estimated Hours: 10h
- Actual Hours: 

## Problem
Users need a way to create and track builds. Without API:
- No programmatic access
- Cannot integrate with tools
- No build history
- Frontend has no backend

Current state: No API endpoints. Static frontend mockups only.

## Goal
Implement /api/v1/builds endpoint for creating and managing dApp builds. Enable full build lifecycle.

## Success Metrics
- POST /builds creates new build
- GET /builds/{id} returns status
- GET /builds returns user history
- WebSocket for real-time updates
- Response time under 200ms

## Technical Scope

Files to create:
```
backend/api/
├── __init__.py
├── main.py
├── routes/
│   ├── __init__.py
│   └── builds.py
├── schemas/
│   ├── __init__.py
│   └── build.py
├── services/
│   ├── __init__.py
│   └── build_service.py
└── tests/
    └── test_builds.py
```

Dependencies:
- fastapi
- pydantic
- sqlalchemy
- websockets

## Minimal Code

```python
# backend/api/schemas/build.py
from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime
import uuid

class BuildStatus(str, Enum):
    PENDING = "pending"
    GENERATING = "generating"
    AUDITING = "auditing"
    DEPLOYING = "deploying"
    COMPLETE = "complete"
    FAILED = "failed"

class ChainTarget(BaseModel):
    chain_id: int
    chain_name: str
    testnet: bool = True

class BuildRequest(BaseModel):
    prompt: str = Field(..., min_length=10, max_length=2000)
    chains: List[int] = Field(..., min_items=1, max_items=10)
    template: Optional[str] = None
    options: Optional[dict] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "prompt": "Create an ERC-20 token called HyperKit with 1 billion supply",
                "chains": [5001],
                "template": "erc20"
            }
        }

class BuildResponse(BaseModel):
    build_id: str
    status: BuildStatus
    created_at: datetime
    estimated_time: int = Field(..., description="Estimated completion in seconds")
    
class BuildDetail(BaseModel):
    build_id: str
    status: BuildStatus
    prompt: str
    chains: List[ChainTarget]
    template: Optional[str]
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]
    
    # Results
    code: Optional[str] = None
    audit_report: Optional[dict] = None
    deployments: Optional[List[dict]] = None
    
    # Metrics
    generation_time: Optional[float] = None
    audit_time: Optional[float] = None
    deploy_time: Optional[float] = None
    total_cost: Optional[float] = None
    
    # Errors
    error: Optional[str] = None
    error_code: Optional[str] = None

class BuildList(BaseModel):
    builds: List[BuildDetail]
    total: int
    page: int
    page_size: int

class BuildUpdate(BaseModel):
    status: BuildStatus
    progress: int = Field(..., ge=0, le=100)
    step: str
    message: Optional[str] = None
```

```python
# backend/api/routes/builds.py
from fastapi import APIRouter, Depends, HTTPException, WebSocket, Query
from fastapi.responses import StreamingResponse
from typing import Optional
import asyncio

from ..schemas.build import (
    BuildRequest, BuildResponse, BuildDetail, 
    BuildList, BuildStatus
)
from ..services.build_service import BuildService
from ..auth import get_current_user

router = APIRouter(prefix="/api/v1/builds", tags=["builds"])

@router.post("/", response_model=BuildResponse)
async def create_build(
    request: BuildRequest,
    user = Depends(get_current_user),
    build_service: BuildService = Depends()
):
    """
    Create a new dApp build.
    
    Initiates the build pipeline:
    1. Validate prompt and parameters
    2. Queue for code generation
    3. Run security audit
    4. Deploy to target chains
    
    Returns build_id for tracking progress.
    """
    try:
        build = await build_service.create_build(
            user_id=user.id,
            prompt=request.prompt,
            chains=request.chains,
            template=request.template,
            options=request.options
        )
        
        return BuildResponse(
            build_id=build.id,
            status=build.status,
            created_at=build.created_at,
            estimated_time=87  # Target: 87 seconds
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{build_id}", response_model=BuildDetail)
async def get_build(
    build_id: str,
    user = Depends(get_current_user),
    build_service: BuildService = Depends()
):
    """Get build details and status."""
    
    build = await build_service.get_build(build_id, user.id)
    
    if not build:
        raise HTTPException(status_code=404, detail="Build not found")
    
    return build

@router.get("/", response_model=BuildList)
async def list_builds(
    user = Depends(get_current_user),
    status: Optional[BuildStatus] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    build_service: BuildService = Depends()
):
    """List user's builds with pagination."""
    
    builds, total = await build_service.list_builds(
        user_id=user.id,
        status=status,
        page=page,
        page_size=page_size
    )
    
    return BuildList(
        builds=builds,
        total=total,
        page=page,
        page_size=page_size
    )

@router.delete("/{build_id}")
async def cancel_build(
    build_id: str,
    user = Depends(get_current_user),
    build_service: BuildService = Depends()
):
    """Cancel a pending or in-progress build."""
    
    success = await build_service.cancel_build(build_id, user.id)
    
    if not success:
        raise HTTPException(status_code=400, detail="Cannot cancel build")
    
    return {"status": "cancelled"}

@router.websocket("/{build_id}/stream")
async def build_stream(
    websocket: WebSocket,
    build_id: str,
    build_service: BuildService = Depends()
):
    """
    WebSocket for real-time build updates.
    
    Sends JSON messages:
    {
        "status": "generating",
        "progress": 45,
        "step": "code_generation",
        "message": "Generating ERC-20 contract..."
    }
    """
    await websocket.accept()
    
    try:
        async for update in build_service.stream_updates(build_id):
            await websocket.send_json(update)
            
            if update["status"] in ["complete", "failed"]:
                break
                
    except Exception as e:
        await websocket.send_json({
            "status": "error",
            "message": str(e)
        })
    finally:
        await websocket.close()

@router.get("/{build_id}/code")
async def get_build_code(
    build_id: str,
    user = Depends(get_current_user),
    build_service: BuildService = Depends()
):
    """Download generated contract code."""
    
    build = await build_service.get_build(build_id, user.id)
    
    if not build or not build.code:
        raise HTTPException(status_code=404, detail="Code not available")
    
    return StreamingResponse(
        iter([build.code]),
        media_type="text/plain",
        headers={
            "Content-Disposition": f"attachment; filename={build_id}.sol"
        }
    )

@router.get("/{build_id}/audit")
async def get_audit_report(
    build_id: str,
    user = Depends(get_current_user),
    build_service: BuildService = Depends()
):
    """Get security audit report."""
    
    build = await build_service.get_build(build_id, user.id)
    
    if not build or not build.audit_report:
        raise HTTPException(status_code=404, detail="Audit not available")
    
    return build.audit_report

@router.post("/{build_id}/deploy")
async def retry_deployment(
    build_id: str,
    chain_ids: List[int],
    user = Depends(get_current_user),
    build_service: BuildService = Depends()
):
    """Retry deployment to specific chains."""
    
    result = await build_service.retry_deployment(
        build_id=build_id,
        user_id=user.id,
        chain_ids=chain_ids
    )
    
    return result
```

```python
# backend/api/services/build_service.py
from typing import Optional, List, Tuple, AsyncIterator
from datetime import datetime
import asyncio

from ..schemas.build import BuildDetail, BuildStatus, BuildUpdate
from ..database import get_db
from ..hyperagent import HyperAgent

class BuildService:
    def __init__(self):
        self.agent = HyperAgent()
    
    async def create_build(
        self,
        user_id: str,
        prompt: str,
        chains: List[int],
        template: Optional[str] = None,
        options: Optional[dict] = None
    ) -> BuildDetail:
        """Create and queue a new build."""
        
        # Create build record
        build = await self._create_build_record(
            user_id=user_id,
            prompt=prompt,
            chains=chains,
            template=template
        )
        
        # Start async build pipeline
        asyncio.create_task(
            self._run_build_pipeline(build.build_id, prompt, chains, template, options)
        )
        
        return build
    
    async def _run_build_pipeline(
        self,
        build_id: str,
        prompt: str,
        chains: List[int],
        template: Optional[str],
        options: Optional[dict]
    ):
        """Execute the build pipeline."""
        
        try:
            # Step 1: Generate code
            await self._update_status(build_id, BuildStatus.GENERATING, 10, "code_generation")
            
            code = await self.agent.generate_code(
                prompt=prompt,
                template=template,
                options=options
            )
            
            await self._save_code(build_id, code)
            
            # Step 2: Audit
            await self._update_status(build_id, BuildStatus.AUDITING, 40, "security_audit")
            
            audit = await self.agent.audit_code(code)
            await self._save_audit(build_id, audit)
            
            if not audit["passed"]:
                # Attempt fix
                code = await self.agent.fix_code(code, audit["findings"])
                audit = await self.agent.audit_code(code)
                await self._save_code(build_id, code)
                await self._save_audit(build_id, audit)
            
            # Step 3: Deploy
            await self._update_status(build_id, BuildStatus.DEPLOYING, 70, "deployment")
            
            deployments = []
            for chain_id in chains:
                result = await self.agent.deploy(code, chain_id)
                deployments.append(result)
            
            await self._save_deployments(build_id, deployments)
            
            # Complete
            await self._update_status(build_id, BuildStatus.COMPLETE, 100, "complete")
            
        except Exception as e:
            await self._update_status(
                build_id, 
                BuildStatus.FAILED, 
                0, 
                "error",
                error=str(e)
            )
    
    async def get_build(self, build_id: str, user_id: str) -> Optional[BuildDetail]:
        """Get build details."""
        # Implementation with database query
        pass
    
    async def list_builds(
        self,
        user_id: str,
        status: Optional[BuildStatus] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[BuildDetail], int]:
        """List builds with pagination."""
        # Implementation with database query
        pass
    
    async def stream_updates(self, build_id: str) -> AsyncIterator[dict]:
        """Stream build updates via Redis pub/sub."""
        # Implementation with Redis subscription
        pass
    
    async def cancel_build(self, build_id: str, user_id: str) -> bool:
        """Cancel a build."""
        # Implementation
        pass
```

## Acceptance Criteria
- [ ] POST /builds creates build record
- [ ] Build pipeline executes async
- [ ] GET /builds/{id} returns full details
- [ ] GET /builds lists with pagination
- [ ] DELETE /builds/{id} cancels build
- [ ] WebSocket streaming working
- [ ] Code download endpoint working
- [ ] Audit report endpoint working
- [ ] Error handling comprehensive
- [ ] Response time under 200ms
- [ ] Rate limiting implemented
- [ ] Authentication required
- [ ] Unit tests (80%+ coverage)
- [ ] Integration tests with HyperAgent
- [ ] OpenAPI docs generated

## Dependencies
- TASK-S2-013: Claude Integration
- TASK-S2-016: Slither Integration
- TASK-S1-003: Database Setup

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes


