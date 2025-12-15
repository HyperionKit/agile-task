# TASK-M3-SDK-002: Capability Router

## Metadata
- Assignee: Aaron
- Role: CTO/Project Architect
- Month: 3 (December 2025)
- Priority: P0
- Status: BACKLOG
- Due Date: 2025-12-20
- Estimated Hours: 8h
- Actual Hours: 

## Problem
Capability router not built. Without router:
- Cannot route to correct adapter
- Chain-specific code needed
- Poor abstraction
- Developer experience poor

Current state: Capability router not implemented.

## Goal
Build capability router that returns correct adapter per chain/action. Universal adapter interface with fallback logic and zero hardcoded chain checks.

## Success Metrics
- Router returns correct adapter per chain/action
- Adapter interface universal
- Fallback logic functional
- Zero hardcoded chain checks
- Tested on all chain types

## Technical Scope

Files to create/modify:
```
packages/
├── sdk/
│   └── src/
│       └── router/
│           └── capability-router.ts
```

Dependencies:
- Network registry
- Chain adapters

## Minimal Code

```typescript
// packages/sdk/src/router/capability-router.ts
export class CapabilityRouter {
  constructor(private registry: NetworkRegistry) {}

  async route(
    action: "deploy" | "call" | "send" | "bridge",
    chain: string,
    options?: RoutingOptions
  ): Promise<Adapter> {
    const config = this.registry.getConfig(chain);

    const required = this.getRequiredCapability(action);
    const capability = config[required];

    if (chain === "solana") {
      return new SolanaAdapter(this.registry.getRPC(chain));
    } else if (chain === "sui") {
      return new SuiAdapter(this.registry.getRPC(chain));
    } else {
      return new EvmAdapter(
        this.registry.getRPC(chain)[0],
        config.chainId,
        config
      );
    }
  }

  private getRequiredCapability(
    action: string
  ): "account" | "payment" | "da" {
    const map = {
      deploy: "da",
      call: "account",
      send: "account",
      bridge: "payment"
    };
    return map[action] || "account";
  }
}
```

## Acceptance Criteria
- [ ] Router returns correct adapter per chain/action
- [ ] Adapter interface universal
- [ ] Fallback logic functional
- [ ] Zero hardcoded chain checks
- [ ] Tested on all chain types

## Dependencies
- TASK-M3-SDK-001: Network Registry

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes

