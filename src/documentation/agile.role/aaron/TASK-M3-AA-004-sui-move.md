# TASK-M3-AA-004: SUI Move Integration

## Metadata
- Assignee: Aaron
- Role: CTO/Project Architect
- Month: 3 (December 2025)
- Priority: P1
- Status: BACKLOG
- Due Date: 2025-12-22
- Estimated Hours: 8h
- Actual Hours: 

## Problem
SUI Move not integrated. Without integration:
- SUI chain not supported
- Missing Move execution
- No SUI deployments
- Limited chain support

Current state: SUI integration not started.

## Goal
Integrate SUI Move: Move module execution, capability-based auth for agents, gas estimation, dynamic networks.

## Success Metrics
- Move module execution working
- Capability-based auth for agents functional
- Gas estimation + dynamic networks working
- Tested on SUI Testnet
- Documentation complete

## Technical Scope

Files to create/modify:
```
packages/
├── aa/
│   └── src/
│       └── sui/
│           └── sui-wallet.ts
```

Dependencies:
- @mysten/sui.js 1.0.0+

## Minimal Code

```typescript
// packages/aa/src/sui/sui-wallet.ts
import { SuiClient } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";

export class SuiWallet {
  private client: SuiClient;
  private signer: RawSigner;

  constructor(mnemonic: string) {
    this.signer = fromMnemonic(mnemonic);
  }

  async executeMove(
    pkg: string,
    module: string,
    fn: string,
    args: any[]
  ) {
    const tx = new TransactionBlock();
    tx.moveCall({
      target: `${pkg}::${module}::${fn}`,
      arguments: args
    });

    const result = await this.signer.signAndExecuteTransactionBlock({
      transactionBlock: tx
    });

    return result.digest;
  }

  async createCapability(agent: string) {
    const tx = new TransactionBlock();
    tx.moveCall({
      target: "0x...::auth::create_capability",
      arguments: [tx.pure(agent)]
    });
    return await this.signer.signAndExecuteTransactionBlock({
      transactionBlock: tx
    });
  }
}
```

## Acceptance Criteria
- [ ] Move module execution (simple swap/transfer)
- [ ] Capability-based auth for agents
- [ ] Gas estimation + dynamic networks
- [ ] Tested on SUI Testnet
- [ ] Documentation complete

## Dependencies
None

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes

