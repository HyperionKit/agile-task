# TASK-M2-034: Load Testing (100 Concurrent)

## Metadata
- Assignee: Aaron
- Role: CTO/Project Architect
- Month: 2 (November 2025)
- Priority: P1
- Status: DONE
- Due Date: 2025-11-20
- Completed Date: 2025-11-20
- Estimated Hours: 8h
- Actual Hours: 

## Problem
System capacity unknown under real load. Without load testing:
- Cannot predict scaling needs
- Bottlenecks hidden
- SLAs unverified
- Production failures likely

Current state: No load testing. Unknown capacity limits.

## Goal
Validate system handles 100 concurrent builds with acceptable performance. Identify and fix bottlenecks.

## Success Metrics
- 100 concurrent builds supported
- P95 response time under 2 seconds
- Zero errors under normal load
- Graceful degradation at limits
- Bottlenecks documented

## Technical Scope

Files to create:
```
tests/load/
├── locustfile.py
├── scenarios/
│   ├── build_flow.py
│   ├── api_stress.py
│   └── websocket_load.py
├── config.yaml
└── reports/
    └── .gitkeep
```

Dependencies:
- locust
- prometheus-client
- grafana dashboards

## Minimal Code

```python
# tests/load/scenarios/build_flow.py
from locust import HttpUser, TaskSet, task, between, events
import json
import time
import random

class BuildFlowTasks(TaskSet):
    """
    Simulates realistic user build flow.
    Weighted tasks based on actual usage patterns.
    """
    
    PROMPTS = [
        "Create ERC-20 token with 1 million supply",
        "Create NFT collection with 10k max supply",
        "Create yield vault for USDC",
        "Create token with 2% burn on transfer",
        "Create governance token with voting",
    ]
    
    CHAINS = [5001, 11155111, 80001]  # Testnets
    
    def on_start(self):
        """Setup for each user"""
        self.builds = []
        self.auth_headers = self._authenticate()
    
    def _authenticate(self) -> dict:
        """Get auth token"""
        response = self.client.post(
            "/api/v1/auth/test-token",
            json={"user_id": f"load-{id(self)}"}
        )
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    @task(10)
    def create_build(self):
        """Create new build (most common action)"""
        start_time = time.time()
        
        response = self.client.post(
            "/api/v1/builds",
            headers=self.auth_headers,
            json={
                "prompt": random.choice(self.PROMPTS),
                "chains": [random.choice(self.CHAINS)],
            },
            name="/api/v1/builds [POST]"
        )
        
        if response.status_code == 200:
            build_id = response.json()["build_id"]
            self.builds.append(build_id)
            
            # Track custom metric
            events.request.fire(
                request_type="BUILD",
                name="build_created",
                response_time=(time.time() - start_time) * 1000,
                response_length=0,
                exception=None,
            )
    
    @task(5)
    def check_build_status(self):
        """Check status of existing build"""
        if not self.builds:
            return
        
        build_id = random.choice(self.builds)
        
        self.client.get(
            f"/api/v1/builds/{build_id}",
            headers=self.auth_headers,
            name="/api/v1/builds/{id} [GET]"
        )
    
    @task(3)
    def list_builds(self):
        """List user's builds"""
        self.client.get(
            "/api/v1/builds?page=1&page_size=20",
            headers=self.auth_headers,
            name="/api/v1/builds [GET]"
        )
    
    @task(2)
    def get_dashboard_stats(self):
        """Fetch dashboard stats"""
        self.client.get(
            "/api/v1/users/me/stats",
            headers=self.auth_headers,
            name="/api/v1/users/me/stats [GET]"
        )
    
    @task(1)
    def download_code(self):
        """Download generated code"""
        if not self.builds:
            return
        
        build_id = random.choice(self.builds)
        
        self.client.get(
            f"/api/v1/builds/{build_id}/code",
            headers=self.auth_headers,
            name="/api/v1/builds/{id}/code [GET]"
        )


class HyperKitLoadUser(HttpUser):
    """Primary load test user"""
    
    tasks = [BuildFlowTasks]
    wait_time = between(1, 3)  # 1-3 seconds between tasks
    
    # Target host
    host = "http://localhost:8000"


class HyperKitHeavyUser(HttpUser):
    """Heavy user (power users, bots)"""
    
    tasks = [BuildFlowTasks]
    wait_time = between(0.5, 1)  # Faster
    weight = 1  # Less common


class HyperKitLightUser(HttpUser):
    """Light user (browsing only)"""
    
    wait_time = between(5, 10)  # Slower
    weight = 3  # More common
    
    @task
    def browse_dashboard(self):
        response = self.client.post(
            "/api/v1/auth/test-token",
            json={"user_id": f"light-{id(self)}"}
        )
        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        self.client.get("/api/v1/builds", headers=headers)
        self.client.get("/api/v1/users/me/stats", headers=headers)
```

```python
# tests/load/scenarios/api_stress.py
from locust import HttpUser, task, constant_throughput
import random

class APIStressUser(HttpUser):
    """
    Stress test for API endpoints.
    Higher throughput, simpler scenarios.
    """
    
    # Fixed throughput: 10 requests per second per user
    wait_time = constant_throughput(10)
    
    def on_start(self):
        response = self.client.post(
            "/api/v1/auth/test-token",
            json={"user_id": f"stress-{id(self)}"}
        )
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    @task(10)
    def health_check(self):
        """Health endpoint (fastest)"""
        self.client.get("/health")
    
    @task(5)
    def list_builds(self):
        """List builds (database read)"""
        self.client.get(
            "/api/v1/builds",
            headers=self.headers
        )
    
    @task(3)
    def get_stats(self):
        """Stats endpoint (aggregation)"""
        self.client.get(
            "/api/v1/users/me/stats",
            headers=self.headers
        )
    
    @task(1)
    def create_build(self):
        """Create build (heavy operation)"""
        self.client.post(
            "/api/v1/builds",
            headers=self.headers,
            json={
                "prompt": "Create simple token",
                "chains": [5001],
            }
        )
```

```yaml
# tests/load/config.yaml
environments:
  development:
    host: "http://localhost:8000"
    users: 10
    spawn_rate: 2
    run_time: "5m"
  
  staging:
    host: "https://staging-api.hyperkit.io"
    users: 50
    spawn_rate: 5
    run_time: "15m"
  
  production_load:
    host: "https://api.hyperkit.io"
    users: 100
    spawn_rate: 10
    run_time: "30m"

thresholds:
  # SLA targets
  response_time_p95: 2000  # 2 seconds
  response_time_p99: 5000  # 5 seconds
  error_rate: 0.01  # 1%
  
  # Endpoint-specific
  build_create_p95: 3000  # 3 seconds
  build_status_p95: 500  # 500ms
  list_builds_p95: 1000  # 1 second

reporting:
  output_dir: "tests/load/reports"
  formats:
    - html
    - json
    - csv
  
  prometheus:
    enabled: true
    port: 9090
  
  grafana:
    dashboard_uid: "hyperkit-load"
```

```bash
#!/bin/bash
# tests/load/run-load-test.sh

# Run load test with configuration
CONFIG=${1:-development}
SCENARIO=${2:-build_flow}

echo "Running load test: $CONFIG / $SCENARIO"

# Start Prometheus metrics exporter
python -m prometheus_client &

# Run Locust
locust \
  -f scenarios/${SCENARIO}.py \
  --headless \
  --users $(yq ".environments.${CONFIG}.users" config.yaml) \
  --spawn-rate $(yq ".environments.${CONFIG}.spawn_rate" config.yaml) \
  --run-time $(yq ".environments.${CONFIG}.run_time" config.yaml) \
  --host $(yq ".environments.${CONFIG}.host" config.yaml) \
  --html reports/${CONFIG}_${SCENARIO}_$(date +%Y%m%d_%H%M%S).html \
  --csv reports/${CONFIG}_${SCENARIO}_$(date +%Y%m%d_%H%M%S)

echo "Load test complete. Reports in tests/load/reports/"
```

## Acceptance Criteria
- [ ] Locust test framework configured
- [ ] Build flow scenario implemented
- [ ] API stress scenario implemented
- [ ] WebSocket load scenario (bonus)
- [ ] Config for dev/staging/prod
- [ ] SLA thresholds defined
- [ ] 100 concurrent users tested
- [ ] P95 under 2 seconds verified
- [ ] Error rate under 1%
- [ ] Bottlenecks identified
- [ ] Grafana dashboard created
- [ ] CI integration for nightly runs
- [ ] HTML reports generated
- [ ] Performance baseline documented

## Dependencies
- TASK-S3-024: API /builds Endpoint
- TASK-S1-004: Monitoring Setup

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes


