# TASK-S4-028: End-to-End Testing

## Metadata
- Assignee: Aaron
- Role: CTO/Project Architect
- Sprint: 4
- Priority: P0
- Status: BACKLOG
- Due Date: 2026-01-28
- Estimated Hours: 16h
- Actual Hours: 

## Problem
System reliability unknown without comprehensive testing. Without E2E:
- Bugs reach production
- Regressions undetected
- User flows untested
- No confidence in releases

Current state: Unit tests only. No integration or E2E coverage.

## Goal
Implement 50+ E2E test scenarios covering all critical user flows and system integrations.

## Success Metrics
- 50+ test scenarios
- 95%+ pass rate
- Full CI integration
- Under 10 minute test suite
- All critical paths covered

## Technical Scope

Files to create:
```
tests/
├── e2e/
│   ├── conftest.py
│   ├── test_build_flow.py
│   ├── test_deployment.py
│   ├── test_audit.py
│   ├── test_api.py
│   └── fixtures/
│       ├── contracts.py
│       └── users.py
├── integration/
│   ├── test_hyperagent.py
│   ├── test_slither.py
│   └── test_deployment.py
└── load/
    └── locustfile.py
```

Dependencies:
- pytest
- pytest-asyncio
- httpx
- locust

## Minimal Code

```python
# tests/e2e/conftest.py
import pytest
import asyncio
import httpx
from typing import AsyncGenerator
import os

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def api_client() -> AsyncGenerator[httpx.AsyncClient, None]:
    """HTTP client for API testing"""
    base_url = os.getenv("API_URL", "http://localhost:8000")
    
    async with httpx.AsyncClient(
        base_url=base_url,
        timeout=60.0
    ) as client:
        yield client

@pytest.fixture(scope="session")
async def auth_headers(api_client: httpx.AsyncClient) -> dict:
    """Get authenticated headers"""
    response = await api_client.post(
        "/api/v1/auth/test-token",
        json={"user_id": "test-user"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def sample_prompts():
    """Sample prompts for testing"""
    return {
        "erc20": "Create an ERC-20 token called TestToken with 1 million supply",
        "erc721": "Create an NFT collection with 10000 max supply and 0.1 ETH mint price",
        "vault": "Create a yield vault that deposits into Aave V3",
        "invalid": "Create something",  # Too vague
    }

@pytest.fixture
def sample_chains():
    """Test chain configurations"""
    return {
        "mantle_testnet": 5001,
        "sepolia": 11155111,
        "multi": [5001, 11155111],
    }
```

```python
# tests/e2e/test_build_flow.py
import pytest
import asyncio
from httpx import AsyncClient

@pytest.mark.asyncio
class TestBuildFlow:
    """End-to-end tests for the complete build flow"""
    
    async def test_create_build_success(
        self,
        api_client: AsyncClient,
        auth_headers: dict,
        sample_prompts: dict,
        sample_chains: dict
    ):
        """Test: User creates a valid build request"""
        
        # Create build
        response = await api_client.post(
            "/api/v1/builds",
            headers=auth_headers,
            json={
                "prompt": sample_prompts["erc20"],
                "chains": [sample_chains["mantle_testnet"]],
                "template": "erc20"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "build_id" in data
        assert data["status"] == "pending"
        assert data["estimated_time"] <= 120
        
        build_id = data["build_id"]
        
        # Wait for completion
        final_status = await self._wait_for_build(
            api_client, auth_headers, build_id, timeout=120
        )
        
        assert final_status["status"] == "complete"
        assert final_status["code"] is not None
        assert len(final_status["code"]) > 100
    
    async def test_create_build_invalid_prompt(
        self,
        api_client: AsyncClient,
        auth_headers: dict,
        sample_prompts: dict,
        sample_chains: dict
    ):
        """Test: Reject builds with invalid prompts"""
        
        response = await api_client.post(
            "/api/v1/builds",
            headers=auth_headers,
            json={
                "prompt": sample_prompts["invalid"],
                "chains": [sample_chains["mantle_testnet"]],
            }
        )
        
        assert response.status_code == 400
        assert "detail" in response.json()
    
    async def test_create_build_multi_chain(
        self,
        api_client: AsyncClient,
        auth_headers: dict,
        sample_prompts: dict,
        sample_chains: dict
    ):
        """Test: Build deploys to multiple chains"""
        
        response = await api_client.post(
            "/api/v1/builds",
            headers=auth_headers,
            json={
                "prompt": sample_prompts["erc20"],
                "chains": sample_chains["multi"],
            }
        )
        
        assert response.status_code == 200
        build_id = response.json()["build_id"]
        
        final_status = await self._wait_for_build(
            api_client, auth_headers, build_id, timeout=180
        )
        
        assert final_status["status"] == "complete"
        assert len(final_status["deployments"]) == 2
        
        for deployment in final_status["deployments"]:
            assert deployment["contract_address"] is not None
            assert deployment["tx_hash"] is not None
    
    async def test_build_audit_failure_auto_fix(
        self,
        api_client: AsyncClient,
        auth_headers: dict,
        sample_chains: dict
    ):
        """Test: Build with audit issues gets auto-fixed"""
        
        # Prompt that might generate vulnerable code
        response = await api_client.post(
            "/api/v1/builds",
            headers=auth_headers,
            json={
                "prompt": "Create a token with transfer that sends to sender first",
                "chains": [sample_chains["mantle_testnet"]],
            }
        )
        
        assert response.status_code == 200
        build_id = response.json()["build_id"]
        
        final_status = await self._wait_for_build(
            api_client, auth_headers, build_id, timeout=180
        )
        
        # Should still complete (auto-fix applied)
        assert final_status["status"] in ["complete", "failed"]
        
        if final_status["status"] == "complete":
            # Audit should pass after fix
            assert final_status["audit_report"]["passed"] == True
    
    async def test_build_cancellation(
        self,
        api_client: AsyncClient,
        auth_headers: dict,
        sample_prompts: dict,
        sample_chains: dict
    ):
        """Test: User can cancel in-progress build"""
        
        # Start build
        response = await api_client.post(
            "/api/v1/builds",
            headers=auth_headers,
            json={
                "prompt": sample_prompts["vault"],  # Complex, takes longer
                "chains": [sample_chains["mantle_testnet"]],
            }
        )
        
        build_id = response.json()["build_id"]
        
        # Wait briefly then cancel
        await asyncio.sleep(2)
        
        cancel_response = await api_client.delete(
            f"/api/v1/builds/{build_id}",
            headers=auth_headers
        )
        
        assert cancel_response.status_code == 200
        
        # Verify cancelled
        status_response = await api_client.get(
            f"/api/v1/builds/{build_id}",
            headers=auth_headers
        )
        
        assert status_response.json()["status"] in ["cancelled", "failed"]
    
    async def test_build_list_pagination(
        self,
        api_client: AsyncClient,
        auth_headers: dict
    ):
        """Test: Build list supports pagination"""
        
        response = await api_client.get(
            "/api/v1/builds?page=1&page_size=5",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "builds" in data
        assert "total" in data
        assert "page" in data
        assert len(data["builds"]) <= 5
    
    async def _wait_for_build(
        self,
        client: AsyncClient,
        headers: dict,
        build_id: str,
        timeout: int = 120
    ) -> dict:
        """Poll build status until complete or timeout"""
        
        start = asyncio.get_event_loop().time()
        
        while True:
            response = await client.get(
                f"/api/v1/builds/{build_id}",
                headers=headers
            )
            
            data = response.json()
            status = data["status"]
            
            if status in ["complete", "failed", "cancelled"]:
                return data
            
            if asyncio.get_event_loop().time() - start > timeout:
                raise TimeoutError(f"Build {build_id} did not complete in {timeout}s")
            
            await asyncio.sleep(2)


@pytest.mark.asyncio
class TestBuildTemplates:
    """Test different template types"""
    
    @pytest.mark.parametrize("template,prompt", [
        ("erc20", "Create ERC-20 token with 1M supply"),
        ("erc721", "Create NFT with 10k max supply"),
        ("vault", "Create vault depositing to Aave"),
    ])
    async def test_template_generation(
        self,
        api_client: AsyncClient,
        auth_headers: dict,
        template: str,
        prompt: str
    ):
        """Test: Each template type generates valid code"""
        
        response = await api_client.post(
            "/api/v1/builds",
            headers=auth_headers,
            json={
                "prompt": prompt,
                "chains": [5001],
                "template": template
            }
        )
        
        assert response.status_code == 200
```

```python
# tests/e2e/test_deployment.py
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
class TestDeployment:
    """Test deployment to various chains"""
    
    async def test_mantle_testnet_deployment(
        self,
        api_client: AsyncClient,
        auth_headers: dict
    ):
        """Test: Contract deploys to Mantle testnet"""
        
        # Create and wait for build
        response = await api_client.post(
            "/api/v1/builds",
            headers=auth_headers,
            json={
                "prompt": "Create simple ERC-20 token",
                "chains": [5001],
            }
        )
        
        build_id = response.json()["build_id"]
        
        # Wait for deployment
        final = await self._wait_for_build(api_client, auth_headers, build_id)
        
        assert final["status"] == "complete"
        
        deployment = final["deployments"][0]
        assert deployment["chain_id"] == 5001
        assert deployment["contract_address"].startswith("0x")
        assert len(deployment["contract_address"]) == 42
        assert deployment["verified"] == True
    
    async def test_contract_verification(
        self,
        api_client: AsyncClient,
        auth_headers: dict
    ):
        """Test: Deployed contract is verified on explorer"""
        
        response = await api_client.post(
            "/api/v1/builds",
            headers=auth_headers,
            json={
                "prompt": "Create ERC-20 with name and symbol",
                "chains": [5001],
            }
        )
        
        build_id = response.json()["build_id"]
        final = await self._wait_for_build(api_client, auth_headers, build_id)
        
        assert final["status"] == "complete"
        
        deployment = final["deployments"][0]
        assert deployment["verified"] == True
        assert "verification_url" in deployment
    
    async def test_gas_estimation_accuracy(
        self,
        api_client: AsyncClient,
        auth_headers: dict
    ):
        """Test: Gas estimates are within 20% of actual"""
        
        response = await api_client.post(
            "/api/v1/builds",
            headers=auth_headers,
            json={
                "prompt": "Create simple ERC-20",
                "chains": [5001],
            }
        )
        
        build_id = response.json()["build_id"]
        final = await self._wait_for_build(api_client, auth_headers, build_id)
        
        deployment = final["deployments"][0]
        
        estimated = deployment.get("gas_estimated", 0)
        actual = deployment.get("gas_used", 0)
        
        if estimated > 0 and actual > 0:
            accuracy = actual / estimated
            assert 0.8 <= accuracy <= 1.2, f"Gas estimate off by {(accuracy-1)*100:.1f}%"
```

```python
# tests/load/locustfile.py
from locust import HttpUser, task, between

class HyperKitUser(HttpUser):
    """Load testing for HyperKit API"""
    
    wait_time = between(1, 5)
    
    def on_start(self):
        """Authenticate user on start"""
        response = self.client.post(
            "/api/v1/auth/test-token",
            json={"user_id": f"load-test-{self.environment.runner.user_count}"}
        )
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    @task(3)
    def create_build(self):
        """Create a new build"""
        self.client.post(
            "/api/v1/builds",
            headers=self.headers,
            json={
                "prompt": "Create ERC-20 token for load testing",
                "chains": [5001],
                "template": "erc20"
            }
        )
    
    @task(5)
    def list_builds(self):
        """List user builds"""
        self.client.get(
            "/api/v1/builds?page=1&page_size=10",
            headers=self.headers
        )
    
    @task(2)
    def get_stats(self):
        """Get user stats"""
        self.client.get(
            "/api/v1/users/me/stats",
            headers=self.headers
        )
```

## Acceptance Criteria
- [ ] Test framework configured (pytest)
- [ ] API client fixtures
- [ ] Auth flow tested
- [ ] Build creation tests (5+ scenarios)
- [ ] Multi-chain deployment tests
- [ ] Audit flow tests
- [ ] Error handling tests
- [ ] Cancellation tests
- [ ] Pagination tests
- [ ] Template generation tests
- [ ] Gas estimation accuracy tests
- [ ] Contract verification tests
- [ ] Load tests with Locust
- [ ] 50+ total test scenarios
- [ ] CI integration
- [ ] Under 10 minute test suite

## Dependencies
- TASK-S3-024: API /builds Endpoint
- TASK-S3-018: ERC-4337 Deployment

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes


