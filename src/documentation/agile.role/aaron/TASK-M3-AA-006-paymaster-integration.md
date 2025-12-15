# TASK-M3-AA-006: Paymaster Integration

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
Paymaster not integrated. Without paymaster:
- Gasless transactions not possible
- Poor user experience
- Missing core feature
- Adoption blocked

Current state: Paymaster integration not started.

## Goal
Integrate Alchemy paymaster (free tier) for gas sponsorship. Enable sponsorship request + response flow with accurate gas limit estimation.

## Success Metrics
- Alchemy paymaster integration (free tier) working
- Sponsorship request + response flow functional
- Gas limit estimation accurate
- Works with ERC-4337 bundler
- Tested end-to-end

## Technical Scope

Files to create/modify:
```
packages/
├── aa/
│   └── src/
│       └── evm/
│           └── paymaster-client.ts
```

Dependencies:
- Alchemy paymaster API
- ERC-4337 bundler

## Minimal Code

```typescript
// packages/aa/src/evm/paymaster-client.ts
export class HyperPaymaster {
  constructor(
    private rpc: string,
    private paymasterAddress: string,
    private paymasterApiKey?: string
  ) {}

  async sponsorUserOp(userOp: UserOperation): Promise<string> {
    const result = await fetch(this.rpc, {
      method: "POST",
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "paymaster_generateAndSignPaymasterAndData",
        params: [userOp],
        id: 1,
        headers: {
          "Authorization": `Bearer ${this.paymasterApiKey}`
        }
      })
    });

    const { result: paymasterAndData } = await result.json();
    return paymasterAndData;
  }

  async sendGaslessTransaction(
    accountAddress: string,
    target: string,
    data: string,
    value: bigint = 0n
  ) {
    const userOp: UserOperation = {
      sender: accountAddress,
      nonce: await this.getNonce(accountAddress),
      initCode: "0x",
      callData: encodeCallData(target, data, value),
      accountGasLimits: "0x...",
      preVerificationGas: "0x...",
      gasPricesInfo: "0x...",
      paymaster: this.paymasterAddress,
      paymasterVerificationGasLimit: "0x...",
      paymasterPostOpGasLimit: "0x...",
      paymasterData: "0x",
      signature: "0x"
    };

    userOp.paymasterAndData = await this.sponsorUserOp(userOp);
    userOp.signature = await this.signUserOp(userOp, accountAddress);

    return await this.sendUserOperation(userOp);
  }
}
```

## Acceptance Criteria
- [ ] Alchemy paymaster integration (free tier)
- [ ] Sponsorship request + response flow
- [ ] Gas limit estimation accurate
- [ ] Works with ERC-4337 bundler
- [ ] Tested end-to-end

## Dependencies
- TASK-M3-AA-001: EntryPoint V0.7 Integration

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes

