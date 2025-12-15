# TASK-M3-SDK-005: SUI Adapter

## Metadata
- Assignee: Aaron
- Role: CTO/Project Architect
- Month: 3 (December 2025)
- Priority: P1
- Status: BACKLOG
- Due Date: 2025-12-22
- Estimated Hours: 10h
- Actual Hours: 

## Problem
SUI adapter not built. Without adapter:
- Cannot deploy to SUI
- No Move execution
- Gas estimation missing
- SUI support missing

Current state: SUI adapter not implemented.

## Goal
Build SUI adapter: Move package deployment, moveCall functionality, dry-run gas estimation. Tested on SUI testnet.

## Success Metrics
- Move package deployment working
- moveCall functionality functional
- Dry-run gas estimation accurate
- Tested on SUI testnet
- Documentation complete

## Technical Scope

Files to create/modify:
```
packages/
├── sdk/
│   └── src/
│       └── adapters/
│           └── sui-adapter.ts
```

Dependencies:
- @mysten/sui.js 1.0.0+

## Minimal Code

```typescript
// packages/sdk/src/adapters/sui-adapter.ts
import { SuiClient } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { RawSigner } from "@mysten/sui.js/signers";

export class SuiAdapter implements IChainAdapter {
  private client: SuiClient;
  private signer: RawSigner;

  constructor(rpc: string, mnemonic: string) {
    this.client = new SuiClient({ url: rpc });
    this.signer = fromMnemonic(mnemonic);
  }

  async deploy(bytecode: string, abi: any[], constructorArgs: any[]) {
    const tx = new TransactionBlock();

    const [upgradeCap] = tx.publish({
      modules: [bytecode],
      dependencies: [SUI_FRAMEWORK_ID]
    });

    tx.transferObjects([upgradeCap], tx.pure(await this.signer.getAddress()));

    const result = await this.signer.signAndExecuteTransactionBlock({
      transactionBlock: tx
    });

    const packageId = result.effects.created?.[0].reference.objectId;

    return {
      address: packageId,
      txHash: result.digest
    };
  }

  async call(address: string, method: string, args: any[]): Promise<any> {
    const tx = new TransactionBlock();

    tx.moveCall({
      target: `${address}::contract::${method}`,
      arguments: args.map((arg) => tx.pure(arg))
    });

    const result = await this.signer.signAndExecuteTransactionBlock({
      transactionBlock: tx
    });

    return result;
  }

  async estimateGas(method: string, args: any[]): Promise<bigint> {
    const tx = new TransactionBlock();
    tx.moveCall({
      target: `0x...::contract::${method}`,
      arguments: args.map((arg) => tx.pure(arg))
    });

    const result = await this.client.dryRunTransactionBlock({
      transactionBlock: await tx.build({ client: this.client })
    });

    return BigInt(result.effects.gasUsed.computationCost);
  }

  async getBalance(address: string): Promise<bigint> {
    const coins = await this.client.getCoins({
      owner: address,
      coinType: "0x2::sui::SUI"
    });

    const total = coins.data.reduce(
      (sum, coin) => sum + BigInt(coin.balance),
      0n
    );
    return total;
  }
}
```

## Acceptance Criteria
- [ ] Move package deployment
- [ ] moveCall functionality
- [ ] Dry-run gas estimation
- [ ] Tested on SUI testnet
- [ ] Documentation complete

## Dependencies
- TASK-M3-SDK-002: Capability Router

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes

