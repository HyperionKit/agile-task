# TASK-S1-004: Monitoring Setup

## Metadata
- Assignee: Aaron
- Role: CTO/Project Architect
- Sprint: 1
- Priority: P2
- Status: BACKLOG
- Due Date: 2025-12-20
- Estimated Hours: 6h
- Actual Hours: 

## Problem
Without monitoring:
- No visibility into system health
- Bugs discovered by users, not alerts
- No performance baseline
- AI model quality unknown
- Outages go undetected

Current state: No observability infrastructure. Flying blind on system performance.

## Goal
Deploy monitoring stack for metrics, logs, and AI experiment tracking. This enables:
- Real-time system health dashboards
- Proactive alerting before outages
- AI model performance comparison
- Build success rate tracking

## Success Metrics
- Dashboard shows all key metrics
- Alerts fire within 1 minute of threshold breach
- Log search returns results in under 5 seconds
- MLflow tracks all model experiments
- 99.5% uptime monitoring accuracy

## Technical Scope

Files to create:
```
backend/
├── observability/
│   ├── metrics.py
│   ├── logger.py
│   └── mlflow_client.py
├── config/
│   └── monitoring.py
infrastructure/
├── prometheus/
│   └── prometheus.yml
├── grafana/
│   └── dashboards/
│       └── hyperkit.json
└── docker-compose.monitoring.yml
```

Dependencies:
- MLflow 2.x
- Prometheus
- Grafana
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Sentry

Integration points:
- All backend services
- HyperAgent model calls
- Database queries

## Minimal Code

```python
# observability/metrics.py
from prometheus_client import Counter, Histogram, Gauge
import time

build_counter = Counter(
    'hyperkit_builds_total',
    'Total builds',
    ['status', 'chain']
)

build_duration = Histogram(
    'hyperkit_build_duration_seconds',
    'Build duration',
    buckets=[10, 30, 60, 90, 120, 180]
)

active_builds = Gauge(
    'hyperkit_active_builds',
    'Currently active builds'
)

model_latency = Histogram(
    'hyperkit_model_latency_seconds',
    'AI model response time',
    ['model', 'task']
)

def track_build(status: str, chain: str, duration: float):
    build_counter.labels(status=status, chain=chain).inc()
    build_duration.observe(duration)

def track_model_call(model: str, task: str, duration: float):
    model_latency.labels(model=model, task=task).observe(duration)
```

```python
# observability/mlflow_client.py
import mlflow
from mlflow.tracking import MlflowClient

mlflow.set_tracking_uri(os.getenv("MLFLOW_TRACKING_URI"))

class ExperimentTracker:
    def __init__(self, experiment_name: str):
        self.experiment = mlflow.set_experiment(experiment_name)
        self.client = MlflowClient()
    
    def log_model_run(
        self,
        model: str,
        task: str,
        input_tokens: int,
        output_tokens: int,
        latency: float,
        accepted: bool
    ):
        with mlflow.start_run():
            mlflow.log_params({
                "model": model,
                "task": task
            })
            mlflow.log_metrics({
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "latency_seconds": latency,
                "accepted": 1 if accepted else 0
            })
    
    def get_acceptance_rate(self, model: str) -> float:
        runs = self.client.search_runs(
            experiment_ids=[self.experiment.experiment_id],
            filter_string=f"params.model = '{model}'"
        )
        if not runs:
            return 0.0
        accepted = sum(r.data.metrics.get("accepted", 0) for r in runs)
        return accepted / len(runs)
```

```yaml
# prometheus/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'hyperkit-api'
    static_configs:
      - targets: ['api:8000']
    metrics_path: '/metrics'

  - job_name: 'hyperkit-agent'
    static_configs:
      - targets: ['hyperagent:8001']

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

rule_files:
  - 'alerts.yml'
```

```python
# observability/logger.py
import structlog
from elasticsearch import AsyncElasticsearch

structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ]
)

logger = structlog.get_logger()

es_client = AsyncElasticsearch([os.getenv("ELASTICSEARCH_URL")])

async def log_event(level: str, message: str, **kwargs):
    log_entry = {
        "level": level,
        "message": message,
        "timestamp": datetime.utcnow().isoformat(),
        **kwargs
    }
    
    await es_client.index(
        index=f"hyperkit-logs-{datetime.utcnow():%Y.%m.%d}",
        document=log_entry
    )
    
    getattr(logger, level)(message, **kwargs)
```

## Acceptance Criteria
- [ ] MLflow deployed and tracking experiments
- [ ] Prometheus collecting metrics
- [ ] Grafana dashboard created with key metrics
- [ ] ELK Stack deployed for logging
- [ ] Sentry configured for error tracking
- [ ] Alert rules defined for critical metrics
- [ ] Health check endpoints exposed
- [ ] Build success rate visible on dashboard
- [ ] Model acceptance rate tracked
- [ ] Log search works in under 5 seconds

## Dependencies
- TASK-S1-003: Database Setup

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes

