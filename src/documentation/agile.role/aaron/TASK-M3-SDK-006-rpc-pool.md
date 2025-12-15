# TASK-M3-SDK-006: RPC Pool & Failover

## Metadata
- Assignee: Aaron
- Role: CTO/Project Architect
- Month: 3 (December 2025)
- Priority: P1
- Status: BACKLOG
- Due Date: 2025-12-22
- Estimated Hours: 6h
- Actual Hours: 

## Problem
RPC pooling not implemented. Without pooling:
- Single point of failure
- No failover
- Poor reliability
- User experience degraded

Current state: Single RPC endpoint used.

## Goal
Implement RPC pool with failover, health check, and latency tracking. Automatic failover when endpoint down, recovery when restored.

## Success Metrics
- Failover tested with endpoint down
- Health check runs correctly
- Recovery works when endpoint restored
- Latency tracking per endpoint
- Documentation complete

## Technical Scope

Files to create/modify:
```
packages/
├── sdk/
│   └── src/
│       └── router/
│           └── rpc-pool.ts
```

Dependencies:
- Multiple RPC endpoints
- Health check mechanism

## Minimal Code

```typescript
// packages/sdk/src/router/rpc-pool.ts
export class RPCPool {
  private rpcEndpoints: string[];
  private health: Map<string, HealthStatus> = new Map();
  private activeIndex: number = 0;

  constructor(endpoints: string[]) {
    this.rpcEndpoints = endpoints;
    endpoints.forEach((ep) => {
      this.health.set(ep, { healthy: true, lastCheck: Date.now() });
    });

    setInterval(() => this.healthCheck(), 30000);
  }

  async call<T>(method: string, params: any[]): Promise<T> {
    const healthy = this.rpcEndpoints.filter(
      (ep) => this.health.get(ep)?.healthy
    );

    for (const endpoint of healthy) {
      try {
        return await this.callEndpoint(endpoint, method, params);
      } catch (e) {
        this.health.get(endpoint)!.healthy = false;
      }
    }

    for (const endpoint of this.rpcEndpoints) {
      try {
        const result = await this.callEndpoint(endpoint, method, params);
        this.health.get(endpoint)!.healthy = true;
        return result;
      } catch (e) {
        // Continue to next
      }
    }

    throw new Error("All RPC endpoints failed");
  }

  private async callEndpoint<T>(
    endpoint: string,
    method: string,
    params: any[]
  ): Promise<T> {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method,
        params,
        id: Math.random()
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.result;
  }

  private async healthCheck() {
    for (const endpoint of this.rpcEndpoints) {
      try {
        await this.callEndpoint(endpoint, "eth_blockNumber", []);
        this.health.get(endpoint)!.healthy = true;
      } catch {
        this.health.get(endpoint)!.healthy = false;
      }
    }
  }
}
```

## Acceptance Criteria
- [ ] Failover tested with endpoint down
- [ ] Health check runs correctly
- [ ] Recovery works when endpoint restored
- [ ] Latency tracking per endpoint
- [ ] Documentation complete

## Dependencies
- TASK-M3-SDK-001: Network Registry

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes

