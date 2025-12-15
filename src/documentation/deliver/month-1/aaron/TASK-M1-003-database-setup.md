# TASK-M1-003: Database Setup

## Metadata
- Assignee: Aaron
- Role: CTO/Project Architect
- Month: 1 (October 2025)
- Priority: P1
- Status: DONE
- Due Date: 2025-10-07
- Completed Date: 2025-10-07
- Estimated Hours: 8h
- Actual Hours: 

## Problem
HyperKit needs persistent storage for:
- Build history and status
- User accounts and points
- Contract templates and metadata
- Session data and caching

Without proper database setup:
- No data persistence between sessions
- Slow queries without indexing
- No backup or recovery
- Cache misses increase latency

Current state: No database infrastructure exists.

## Goal
Deploy PostgreSQL for persistent storage and Redis for caching. This enables:
- Fast build status queries (under 50ms)
- User session management
- Points and contribution tracking
- Real-time build progress via pub/sub

## Success Metrics
- PostgreSQL query time under 50ms (p95)
- Redis cache hit rate above 90%
- Database migrations run without errors
- Backup automation verified
- Connection pool handles 100 concurrent connections

## Technical Scope

Files to create:
```
backend/
├── database/
│   ├── migrations/
│   │   ├── 001_create_users.sql
│   │   ├── 002_create_builds.sql
│   │   └── 003_create_templates.sql
│   ├── schema.sql
│   └── seed.sql
├── config/
│   └── database.py
└── models/
    ├── user.py
    ├── build.py
    └── template.py
```

Dependencies:
- PostgreSQL 14+
- Redis 7.x
- SQLAlchemy 2.x
- Alembic (migrations)
- asyncpg (async driver)

Integration points:
- HyperAgent build service
- Dashboard API
- Points system

## Minimal Code

```sql
-- migrations/001_create_users.sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(100) UNIQUE NOT NULL,
    points INTEGER DEFAULT 0,
    tier VARCHAR(20) DEFAULT 'free',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_wallet ON users(wallet_address);
```

```sql
-- migrations/002_create_builds.sql
CREATE TABLE builds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    prompt TEXT NOT NULL,
    chains JSONB NOT NULL,
    contract_code TEXT,
    contract_address VARCHAR(100),
    audit_result JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_builds_user ON builds(user_id);
CREATE INDEX idx_builds_status ON builds(status);
```

```python
# config/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import redis.asyncio as redis

DATABASE_URL = os.getenv("DATABASE_URL")
REDIS_URL = os.getenv("REDIS_URL")

engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=10,
    pool_timeout=30
)

AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

redis_client = redis.from_url(REDIS_URL)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
```

```python
# models/build.py
from sqlalchemy import Column, String, Text, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

class Build(Base):
    __tablename__ = "builds"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    status = Column(String(20), default="pending")
    prompt = Column(Text, nullable=False)
    chains = Column(JSON, nullable=False)
    contract_code = Column(Text)
    contract_address = Column(String(100))
    audit_result = Column(JSON)
    
    user = relationship("User", back_populates="builds")
```

## Acceptance Criteria
- [ ] PostgreSQL provisioned (PlanetScale or Supabase)
- [ ] Redis provisioned (Redis Cloud or Upstash)
- [ ] Users table created with indexes
- [ ] Builds table created with indexes
- [ ] Templates table created
- [ ] SQLAlchemy models match schema
- [ ] Alembic migrations configured
- [ ] Connection pooling working (20 connections)
- [ ] Backup automation configured
- [ ] Environment variables documented
- [ ] Query time under 50ms verified

## Dependencies
- TASK-S1-001: Setup GitHub Monorepo

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes

