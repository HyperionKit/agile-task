# TASK-M3-AA-001: EntryPoint V0.7 Integration

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
EntryPoint V0.7 not integrated. Without integration:
- ERC-4337 not functional
- Smart accounts cannot be created
- Gasless transactions impossible
- Core feature missing

Current state: EntryPoint integration not started.

## Goal
Integrate EntryPoint V0.7 on Mantle + Metis + Hyperion testnets. Enable SimpleAccount factory with arbitrary owners.

## Success Metrics
- EntryPoint v0.7 integrated
- SimpleAccount factory working
- Gas estimation accurate within 10%
- Bundler integration functional
- Tested on all 3 testnets

## Technical Scope

Files to create/modify:
```
packages/
├── aa/
│   └── src/
│       └── evm/
│           └── entry-point.ts
```

Dependencies:
- account-abstraction SDK 0.7.0
- Alchemy bundler

## Minimal Code

```typescript
// packages/aa/src/evm/entry-point.ts
import { EntryPointV07 } from "account-abstraction-sdk";
import { SimpleAccountFactory } from "account-abstraction-sdk";

export class HyperWalletFactory {
  private factory: SimpleAccountFactory;
  private entryPoint: EntryPointV07;

  constructor(rpc: string, chainId: number) {
    this.entryPoint = new EntryPointV07(rpc);
    this.factory = new SimpleAccountFactory(
      SIMPLE_ACCOUNT_FACTORY_ADDRESS,
      this.entryPoint.address
    );
  }

  async createAccount(owner: string, salt: number = 0) {
    const tx = await this.factory.createAccount(owner, salt);
    return {
      accountAddress: await this.factory.getAddress(owner, salt),
      txHash: tx.hash
    };
  }

  async sendUserOperation(userOp: UserOperation, paymasterUrl?: string) {
    // Fill gas estimates
    userOp.callGasLimit = await this.entryPoint.estimateCallGasLimit(userOp);
    userOp.preVerificationGas = await this.entryPoint.estimatePreVerificationGas(userOp);
    
    // Sign if needed
    if (paymasterUrl) {
      const sponsorshipResult = await fetch(paymasterUrl, {
        method: "POST",
        body: JSON.stringify({ userOp })
      });
      const { paymasterAndData } = await sponsorshipResult.json();
      userOp.paymasterAndData = paymasterAndData;
    }

    // Submit to bundler
    return await this.entryPoint.sendUserOperation(userOp);
  }
}
```

## Acceptance Criteria
- [ ] EntryPoint v0.7 integration on Mantle + Metis + Hyperion testnets
- [ ] SimpleAccount factory works with arbitrary owners
- [ ] Gas estimation accurate within 10%
- [ ] Bundler integration with Alchemy (free tier)
- [ ] Tests passing

## Dependencies
None

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes

