# TASK-M3-SDK-003: EVM Adapter

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
EVM adapter not built. Without adapter:
- Cannot deploy to EVM chains
- No contract calls
- Gas estimation missing
- Core functionality missing

Current state: EVM adapter not implemented.

## Goal
Build EVM adapter: deploy, call, gas estimation working. Tested on Mantle, Metis, Hyperion with accurate gas estimation within 10%.

## Success Metrics
- Deploy, call, gas estimation working
- Tested on Mantle, Metis, Hyperion
- Error handling (RPC down, tx reverted)
- Gas estimation accurate within 10%
- Documentation complete

## Technical Scope

Files to create/modify:
```
packages/
├── sdk/
│   └── src/
│       └── adapters/
│           └── evm-adapter.ts
```

Dependencies:
- ethers.js 6.x
- JsonRpcProvider

## Minimal Code

```typescript
// packages/sdk/src/adapters/evm-adapter.ts
import { JsonRpcProvider, Contract, Interface } from "ethers";

export interface IChainAdapter {
  deploy(bytecode: string, abi: any[], constructorArgs: any[]): Promise<DeployResult>;
  call(address: string, method: string, args: any[]): Promise<any>;
  estimateGas(method: string, args: any[]): Promise<bigint>;
  getBalance(address: string): Promise<bigint>;
}

export class EvmAdapter implements IChainAdapter {
  private provider: JsonRpcProvider;
  private signer: Signer;

  constructor(
    rpc: string,
    public chainId: number,
    public config: NetworkConfig
  ) {
    this.provider = new JsonRpcProvider(rpc, chainId);
  }

  async deploy(bytecode: string, abi: any[], constructorArgs: any[]) {
    const factory = new ContractFactory(abi, bytecode, this.signer);
    const contract = await factory.deploy(...constructorArgs);
    await contract.waitForDeployment();

    return {
      address: await contract.getAddress(),
      txHash: contract.deploymentTransaction()?.hash,
      blockNumber: contract.deploymentTransaction()?.blockNumber
    };
  }

  async call(address: string, method: string, args: any[]): Promise<any> {
    const contract = new Contract(address, CONTRACT_ABI, this.provider);
    return await contract[method](...args);
  }

  async estimateGas(method: string, args: any[]): Promise<bigint> {
    const tx = {
      to: "0x...",
      data: CONTRACT_INTERFACE.encodeFunctionData(method, args)
    };
    return await this.provider.estimateGas(tx);
  }

  async getBalance(address: string): Promise<bigint> {
    return await this.provider.getBalance(address);
  }
}
```

## Acceptance Criteria
- [ ] Deploy, call, gas estimation working
- [ ] Tested on Mantle, Metis, Hyperion
- [ ] Error handling (RPC down, tx reverted)
- [ ] Gas estimation accurate within 10%
- [ ] Documentation complete

## Dependencies
- TASK-M3-SDK-002: Capability Router

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes

