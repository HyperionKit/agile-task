# TASK-M1-010: Cache Layer (Redis)

## Metadata
- Assignee: Aaron
- Role: CTO/Project Architect
- Month: 1 (October 2025)
- Priority: P2
- Status: DONE
- Due Date: 2025-10-18
- Completed Date: 2025-10-18
- Estimated Hours: 5h
- Actual Hours: 

## Problem
Repeated prompts waste API credits and time. Without caching:
- Same contract generated multiple times costs tokens
- Response latency high for cached results
- No cost optimization for repeat requests
- Model API rate limits hit faster

Current state: Every request calls LLM API. No caching.

## Goal
Implement Redis cache layer for model responses. Enable semantic caching for similar prompts.

## Success Metrics
- 60% cache hit rate on common requests
- Response time under 100ms for cached results
- API cost reduced by 40%
- Cache invalidation working correctly
- No stale data served

## Technical Scope

Files to create:
```
backend/hyperagent/
├── cache/
│   ├── __init__.py
│   ├── redis_cache.py
│   ├── semantic_cache.py
│   └── cache_keys.py
└── tests/
    └── test_cache.py
```

Dependencies:
- redis
- aioredis
- sentence-transformers (semantic similarity)

## Minimal Code

```python
# backend/hyperagent/cache/redis_cache.py
import redis.asyncio as redis
import hashlib
import json
from typing import Optional
from datetime import timedelta

class RedisCache:
    """
    Redis-based cache for model responses.
    Supports exact and semantic matching.
    """
    
    DEFAULT_TTL = timedelta(hours=24)
    
    def __init__(self, redis_url: str):
        self.client = redis.from_url(redis_url)
        self.prefix = "hyperkit:cache:"
    
    async def get(self, key: str) -> Optional[dict]:
        """Get cached response"""
        full_key = self.prefix + key
        data = await self.client.get(full_key)
        
        if data:
            return json.loads(data)
        return None
    
    async def set(
        self,
        key: str,
        value: dict,
        ttl: Optional[timedelta] = None
    ) -> None:
        """Cache response"""
        full_key = self.prefix + key
        ttl = ttl or self.DEFAULT_TTL
        
        await self.client.setex(
            full_key,
            ttl,
            json.dumps(value)
        )
    
    async def get_or_set(
        self,
        key: str,
        compute_fn,
        ttl: Optional[timedelta] = None
    ) -> dict:
        """Get from cache or compute and cache"""
        cached = await self.get(key)
        if cached:
            return {**cached, "cache_hit": True}
        
        result = await compute_fn()
        await self.set(key, result, ttl)
        return {**result, "cache_hit": False}
    
    async def invalidate(self, pattern: str) -> int:
        """Invalidate keys matching pattern"""
        full_pattern = self.prefix + pattern
        keys = await self.client.keys(full_pattern)
        
        if keys:
            return await self.client.delete(*keys)
        return 0
    
    @staticmethod
    def generate_key(
        task: str,
        prompt: str,
        model: str,
        template: Optional[str] = None
    ) -> str:
        """Generate deterministic cache key"""
        components = [task, prompt, model, template or ""]
        content = "|".join(components)
        return hashlib.sha256(content.encode()).hexdigest()[:32]


# backend/hyperagent/cache/semantic_cache.py
from sentence_transformers import SentenceTransformer
import numpy as np
from typing import Optional, List, Tuple

class SemanticCache:
    """
    Semantic similarity caching.
    Returns cached results for similar prompts.
    """
    
    SIMILARITY_THRESHOLD = 0.92
    
    def __init__(self, redis_cache: RedisCache):
        self.redis = redis_cache
        self.encoder = SentenceTransformer('all-MiniLM-L6-v2')
        self.embedding_prefix = "hyperkit:embeddings:"
    
    async def find_similar(
        self,
        prompt: str,
        task: str,
        limit: int = 5
    ) -> Optional[dict]:
        """Find cached response for similar prompt"""
        
        # Generate embedding
        query_embedding = self.encoder.encode(prompt)
        
        # Get all embeddings for task
        keys = await self.redis.client.keys(
            f"{self.embedding_prefix}{task}:*"
        )
        
        best_match = None
        best_score = 0
        
        for key in keys[:100]:  # Limit search
            stored = await self.redis.client.get(key)
            if not stored:
                continue
            
            data = json.loads(stored)
            stored_embedding = np.array(data["embedding"])
            
            # Cosine similarity
            score = np.dot(query_embedding, stored_embedding) / (
                np.linalg.norm(query_embedding) * np.linalg.norm(stored_embedding)
            )
            
            if score > best_score and score >= self.SIMILARITY_THRESHOLD:
                best_score = score
                best_match = data["cache_key"]
        
        if best_match:
            return await self.redis.get(best_match)
        
        return None
    
    async def store_embedding(
        self,
        prompt: str,
        task: str,
        cache_key: str
    ) -> None:
        """Store prompt embedding for future similarity search"""
        
        embedding = self.encoder.encode(prompt).tolist()
        
        key = f"{self.embedding_prefix}{task}:{cache_key}"
        data = {
            "embedding": embedding,
            "cache_key": cache_key,
            "prompt": prompt[:200]  # Store snippet for debugging
        }
        
        await self.redis.client.setex(
            key,
            timedelta(days=7),
            json.dumps(data)
        )
```

## Acceptance Criteria
- [ ] RedisCache class implemented
- [ ] Key generation deterministic
- [ ] TTL-based expiration
- [ ] Cache hit/miss tracking
- [ ] SemanticCache implemented
- [ ] Embedding storage
- [ ] Similarity search working
- [ ] 92% threshold tuned
- [ ] Pattern-based invalidation
- [ ] Integration with model router
- [ ] 60% hit rate on test workload
- [ ] Unit tests passing

## Dependencies
- TASK-S1-003: Database Setup (Redis)

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes


