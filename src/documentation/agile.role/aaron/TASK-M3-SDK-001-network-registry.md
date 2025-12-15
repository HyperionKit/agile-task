# TASK-M3-SDK-001: Network Registry

## Metadata
- Assignee: Aaron
- Role: CTO/Project Architect
- Month: 3 (December 2025)
- Priority: P0
- Status: BACKLOG
- Due Date: 2025-12-20
- Estimated Hours: 10h
- Actual Hours: 

## Problem
Network registry not built. Without registry:
- Chain support limited
- Hardcoded chain configs
- No runtime chain addition
- Poor developer experience

Current state: Network registry not implemented.

## Goal
Build network registry supporting 100+ chains (50 EVM, 10 Solana variants, 10 Cosmos, 30 others) with runtime configuration. No code changes needed to add new chain.

## Success Metrics
- Registry supports 100+ chains
- No code changes needed to add new chain
- RPC failover tested
- Lazy-loaded network configs
- Documentation complete

## Technical Scope

Files to create/modify:
```
packages/
├── sdk/
│   └── src/
│       └── registry/
│           └── network-registry.ts
```

Dependencies:
- Chain metadata
- RPC endpoints

## Minimal Code

```typescript
// packages/sdk/src/registry/network-registry.ts
export interface NetworkConfig {
  chainId: number;
  name: string;
  rpc: string[];
  blockExplorers: { name: string; url: string }[];
  
  capabilities: {
    account: {
      type: "ERC-4337" | "EIP-7702" | "Phantom" | "SUI";
      entryPoint?: string;
      accountFactory?: string;
    };
    payment: {
      facilitator: "thirdweb_x402" | "lazai" | "socket" | "direct";
      metering: boolean;
      creditsPerRun: number;
    };
    da: {
      provider: "EigenDA" | "Mantle" | "Walrus" | "Blobs";
    };
  };
}

export const NETWORK_REGISTRY: Record<string, NetworkConfig> = {
  mantle: {
    chainId: 5000,
    name: "Mantle",
    rpc: ["https://rpc.mantle.xyz", "https://mantle-rpc.mantle.xyz"],
    blockExplorers: [{ name: "Explorer", url: "https://explorer.mantle.xyz" }],
    capabilities: {
      account: { type: "ERC-4337", entryPoint: "0x...", accountFactory: "0x..." },
      payment: { facilitator: "thirdweb_x402", metering: true, creditsPerRun: 3 },
      da: { provider: "Mantle" }
    }
  },
  // ... 99+ more chains
};

export class NetworkRegistry {
  getConfig(chain: string): NetworkConfig {
    const config = NETWORK_REGISTRY[chain.toLowerCase()];
    if (!config) throw new Error(`Unsupported chain: ${chain}`);
    return config;
  }

  addRuntime(chain: string, config: NetworkConfig) {
    NETWORK_REGISTRY[chain] = config;
  }
}
```

## Acceptance Criteria
- [ ] Registry supports 100+ chains (50 EVM, 10 Solana variants, 10 Cosmos, 30 others)
- [ ] No code changes needed to add new chain
- [ ] RPC failover tested
- [ ] Lazy-loaded network configs
- [ ] Documentation complete

## Dependencies
None

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes

