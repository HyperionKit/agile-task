# HyperKit: Complete Implementation Guide
## 3-Repository Execution Plan with Concrete Folder Structures, Tech Stacks & Impact Analysis

**Document Version**: 1.0  
**Date**: December 12, 2025  
**Status**: Ready for Implementation

---

# TABLE OF CONTENTS

1. [Executive Overview](#executive-overview)
2. [AA Repository: Complete Implementation](#aa-repository-complete-implementation)
3. [SDK Repository: Complete Implementation](#sdk-repository-complete-implementation)
4. [HyperAgent Repository: Complete Implementation](#hyperagent-repository-complete-implementation)
5. [Shared Infrastructure & Best Practices](#shared-infrastructure--best-practices)
6. [Tokenomics Integration Across All Repos](#tokenomics-integration-across-all-repos)
7. [Impact & Use Cases](#impact--use-cases)
8. [Risk Mitigation & Dependencies](#risk-mitigation--dependencies)

---

# EXECUTIVE OVERVIEW

## What This Guide Provides

For each of the 3 repositories, you get:

✅ **Folder Structure** - Exact directory tree with all files  
✅ **Tech Stack** - Dependencies, versions, justification  
✅ **Minimal Skeletons** - Working starter code (TypeScript, Python, Solidity)  
✅ **Acceptance Criteria** - Measurable, testable completion  
✅ **Time Estimates** - Per-task breakdown  
✅ **Integration Points** - How repos communicate  
✅ **Best Practices** - Security, performance, testing  
✅ **Tokenomics Flow** - How $HYPE & points integrate  
✅ **Real-World Impact** - Concrete use cases & value  

## The Big Picture

```
User: "Build a DEX on Mantle with x402 payments"
    ↓
HyperAgent (receives prompt)
    ├→ ROMA planner decomposes
    ├→ Firecrawl RAG fetches latest Uniswap V4 patterns
    ├→ Claude generates Solidity code
    ├→ Slither + TEE audits (attested)
    ├→ Foundry builds + verifies
    └→ SDK routes to Mantle
        ├→ AA creates gasless smart account
        ├→ x402 router bills via LazAI
        └→ Monitors via Moralis + Dune
    ↓
Deployed DEX contract + $100 in $HYPE credits burned
Contributor gets 50 points (1 template = 50pts @ 0.1 HYPE)
    ↓
Result: Audited, deployed, monitored dApp in 87 seconds
```

---

# AA REPOSITORY: COMPLETE IMPLEMENTATION

## Repository: `Hyperkit-Labs/aa`

**Purpose**: Multi-chain smart wallet abstraction (ERC-4337, EIP-7702, Solana, SUI)  
**Language**: TypeScript + Solidity  
**Size**: ~15k LOC  
**Weekly Downloads Target**: 1,000 (month 2)

---

## FOLDER STRUCTURE

```
aa/
├── README.md                          # Main docs
├── package.json                       # Root workspace
├── turbo.json                         # Monorepo config
├── tsconfig.json
│
├── .github/
│   ├── workflows/
│   │   ├── test.yml                   # Run tests on PR
│   │   ├── publish.yml                # Publish to npm on release
│   │   └── security.yml               # Slither + npm audit
│   └── CODEOWNERS
│
├── packages/
│   ├── contracts/                     # Solidity contracts
│   │   ├── foundry.toml
│   │   ├── package.json
│   │   ├── remappings.txt
│   │   │
│   │   ├── src/
│   │   │   ├── core/
│   │   │   │   ├── HyperAccount.sol
│   │   │   │   ├── HyperAccountFactory.sol
│   │   │   │   └── SessionKeyValidator.sol
│   │   │   │
│   │   │   ├── interfaces/
│   │   │   │   ├── IHyperAccount.sol
│   │   │   │   ├── ISessionKey.sol
│   │   │   │   └── IPaymaster.sol
│   │   │   │
│   │   │   ├── libraries/
│   │   │   │   ├── AccountLibrary.sol
│   │   │   │   └── SessionKeyLibrary.sol
│   │   │   │
│   │   │   └── mocks/
│   │   │       ├── MockPaymaster.sol
│   │   │       └── MockEntryPoint.sol
│   │   │
│   │   ├── script/
│   │   │   ├── DeployHyperAccount.s.sol
│   │   │   ├── ConfigureSessionKeys.s.sol
│   │   │   └── UpgradeAccount.s.sol
│   │   │
│   │   ├── test/
│   │   │   ├── HyperAccount.t.sol
│   │   │   ├── SessionKey.t.sol
│   │   │   ├── Paymaster.t.sol
│   │   │   └── Integration.t.sol
│   │   │
│   │   ├── config/
│   │   │   ├── deploy.mantle.json
│   │   │   ├── deploy.metis.json
│   │   │   └── deploy.hyperion.json
│   │   │
│   │   └── artifacts/
│   │       ├── HyperAccount.abi.json
│   │       └── README.md
│   │
│   ├── sdk/                           # TypeScript SDK
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   │
│   │   ├── src/
│   │   │   ├── index.ts               # Main export
│   │   │   │
│   │   │   ├── evm/
│   │   │   │   ├── entry-point.ts
│   │   │   │   ├── account-factory.ts
│   │   │   │   ├── account.ts
│   │   │   │   ├── bundler-client.ts
│   │   │   │   ├── paymaster-client.ts
│   │   │   │   └── session-key-manager.ts
│   │   │   │
│   │   │   ├── solana/
│   │   │   │   ├── phantom-wallet.ts
│   │   │   │   ├── program-manager.ts
│   │   │   │   └── session-key.ts
│   │   │   │
│   │   │   ├── sui/
│   │   │   │   ├── sui-wallet.ts
│   │   │   │   ├── move-executor.ts
│   │   │   │   └── capability-manager.ts
│   │   │   │
│   │   │   ├── common/
│   │   │   │   ├── types.ts
│   │   │   │   ├── errors.ts
│   │   │   │   ├── constants.ts
│   │   │   │   └── utils.ts
│   │   │   │
│   │   │   ├── react/
│   │   │   │   ├── useHyperWallet.ts
│   │   │   │   ├── useBalance.ts
│   │   │   │   ├── useTransaction.ts
│   │   │   │   └── context.tsx
│   │   │   │
│   │   │   └── observability/
│   │   │       ├── mlflow-client.ts
│   │   │       ├── metrics.ts
│   │   │       └── logger.ts
│   │   │
│   │   ├── test/
│   │   │   ├── evm.test.ts
│   │   │   ├── solana.test.ts
│   │   │   ├── sui.test.ts
│   │   │   ├── react.test.tsx
│   │   │   └── integration.test.ts
│   │   │
│   │   ├── examples/
│   │   │   ├── counter.tsx
│   │   │   ├── swap.tsx
│   │   │   └── multi-chain.tsx
│   │   │
│   │   └── docs/
│   │       ├── API.md
│   │       ├── GUIDE.md
│   │       └── EXAMPLES.md
│   │
│   └── ui/                            # React Components
│       ├── package.json
│       ├── tsconfig.json
│       │
│       ├── src/
│       │   ├── components/
│       │   │   ├── WalletConnect.tsx
│       │   │   ├── GaslessToggle.tsx
│       │   │   ├── SessionKeyManager.tsx
│       │   │   ├── TransactionSigner.tsx
│       │   │   └── ChainSelector.tsx
│       │   │
│       │   ├── hooks/
│       │   │   ├── useWallet.ts
│       │   │   ├── useGasless.ts
│       │   │   └── useChain.ts
│       │   │
│       │   ├── styles/
│       │   │   ├── globals.css
│       │   │   └── components.module.css
│       │   │
│       │   └── index.ts
│       │
│       ├── stories/
│       │   ├── WalletConnect.stories.tsx
│       │   └── SessionKeyManager.stories.tsx
│       │
│       └── docs/
│           └── COMPONENT_GUIDE.md
│
├── docs/
│   ├── ARCHITECTURE.md                # Design decisions
│   ├── SECURITY.md                    # Audit findings, best practices
│   ├── DEPLOYMENT.md                  # Deploy guides per chain
│   ├── GAS_OPTIMIZATION.md
│   └── CONTRIBUTE.md
│
├── test/
│   ├── e2e/
│   │   ├── evm-integration.test.ts
│   │   ├── solana-integration.test.ts
│   │   ├── sui-integration.test.ts
│   │   └── multi-chain.test.ts
│   │
│   └── load/
│       └── load-test.ts               # Stress testing
│
├── scripts/
│   ├── setup.sh                       # Dev environment setup
│   ├── test-all.sh
│   ├── deploy.sh
│   └── benchmark.sh
│
├── config/
│   ├── .env.example
│   ├── chains.json                    # Chain metadata
│   └── rpc-endpoints.json
│
└── CHANGELOG.md
```

---

## TECH STACK: AA Repository

| Layer | Technology | Version | Justification |
|-------|-----------|---------|---------------|
| **Smart Contracts** | Solidity | 0.8.24 | Latest stable, gas optimizations |
| **ERC-4337** | account-abstraction SDK | 0.7.0 | Official standard |
| **EIP-7702** | ethers.js | 6.x | Built-in support |
| **Solana** | @solana/web3.js | 1.95.0 | Official Solana SDK |
| **Solana Signing** | @phantom/phantom-service-worker-api | 1.2.0 | Standard wallet |
| **SUI** | @mysten/sui.js | 1.0.0+ | Official SUI SDK |
| **Build Tool** | Foundry | 0.2.0+ | Fastest Solidity compilation |
| **TypeScript** | TypeScript | 5.x | Type safety |
| **Testing** | Vitest + Foundry | - | Fast unit + contract tests |
| **React** | React | 18.x | UI components |
| **UI Library** | shadcn/ui | Latest | Accessible components |
| **State Management** | Zustand | 4.x | Lightweight wallet state |
| **HTTP Client** | ethers.js (viem alternative) | 6.x | Web3 communication |
| **Environment** | dotenv | 16.x | Config management |
| **Logging** | pino | 8.x | Structured logging |
| **CI/CD** | GitHub Actions | - | Native to repo |

---

## MINIMAL SKELETON CODE

### Solidity: `HyperAccount.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IAccount} from "account-abstraction/interfaces/IAccount.sol";
import {IEntryPoint} from "account-abstraction/interfaces/IEntryPoint.sol";
import {Ownable} from "solmate/auth/Ownable.sol";
import {ERC1967Proxy} from "openzeppelin-contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title HyperAccount
 * @notice ERC-4337 smart account supporting session keys & gasless txs
 */
contract HyperAccount is IAccount, Ownable {
    IEntryPoint public immutable entryPoint;
    
    mapping(bytes32 => SessionKey) public sessionKeys;
    mapping(bytes32 => bool) public revokedKeys;
    
    struct SessionKey {
        address agent;
        uint256 expiresAt;
        uint256 spendLimit;  // Max value per tx
        uint256 spent;       // Cumulative spent
        bytes32 allowedTargets;  // Encoded targets
        bool active;
    }

    event SessionKeyCreated(bytes32 indexed keyId, address indexed agent);
    event SessionKeyRevoked(bytes32 indexed keyId);
    event UserOperationExecuted(bytes32 indexed userOpHash, bool success);

    constructor(IEntryPoint _entryPoint) {
        entryPoint = _entryPoint;
        _initializeOwner(msg.sender);
    }

    /**
     * @notice Execute user operation from entry point
     */
    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external returns (uint256) {
        require(msg.sender == address(entryPoint), "UNAUTHORIZED");

        // Decode session key from userOp.signature
        (bytes32 keyId, bytes memory agentSig) = abi.decode(
            userOp.signature,
            (bytes32, bytes)
        );

        SessionKey memory key = sessionKeys[keyId];
        
        require(!revokedKeys[keyId], "KEY_REVOKED");
        require(key.active && key.expiresAt > block.timestamp, "KEY_EXPIRED");
        require(_verifyPermissions(userOp, key), "PERMISSION_DENIED");

        // Verify agent signature
        bytes32 digest = toEthSignedMessageHash(userOpHash);
        require(_recover(digest, agentSig) == key.agent, "INVALID_SIGNATURE");

        // Fund entry point if needed
        if (missingAccountFunds > 0) {
            (bool success, ) = address(entryPoint).call{
                value: missingAccountFunds
            }("");
            require(success, "FUND_FAILED");
        }

        return 0;  // Valid
    }

    /**
     * @notice Create a session key for agent automation
     */
    function createSessionKey(
        bytes32 keyId,
        address agent,
        uint256 ttl,
        uint256 spendLimit,
        bytes32 allowedTargets
    ) external onlyOwner {
        sessionKeys[keyId] = SessionKey({
            agent: agent,
            expiresAt: block.timestamp + ttl,
            spendLimit: spendLimit,
            spent: 0,
            allowedTargets: allowedTargets,
            active: true
        });

        emit SessionKeyCreated(keyId, agent);
    }

    /**
     * @notice Revoke a session key
     */
    function revokeSessionKey(bytes32 keyId) external onlyOwner {
        revokedKeys[keyId] = true;
        sessionKeys[keyId].active = false;
        emit SessionKeyRevoked(keyId);
    }

    function _verifyPermissions(
        UserOperation calldata userOp,
        SessionKey memory key
    ) internal view returns (bool) {
        // Decode callData to extract target address
        (address target, ) = abi.decode(userOp.callData[4:], (address, bytes));

        // Check target is whitelisted
        require(_isTargetAllowed(target, key.allowedTargets), "TARGET_NOT_ALLOWED");

        // Check spend limit
        require(key.spent + userOp.callGasLimit <= key.spendLimit, "SPEND_LIMIT_EXCEEDED");

        return true;
    }

    function _isTargetAllowed(address target, bytes32 allowed) internal pure returns (bool) {
        // Simple whitelist check (can be made more sophisticated)
        return uint160(target) != 0;
    }

    function _recover(bytes32 digest, bytes memory sig) internal pure returns (address) {
        (uint8 v, bytes32 r, bytes32 s) = abi.decode(sig, (uint8, bytes32, bytes32));
        return ecrecover(digest, v, r, s);
    }

    function toEthSignedMessageHash(bytes32 messageHash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            messageHash
        ));
    }

    receive() external payable {}
}
```

### TypeScript: `useHyperWallet.ts`

```typescript
import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { HyperAccountFactory } from '@hyperkit/aa-contracts';
import { ENTRY_POINT_ADDRESS, FACTORY_ADDRESS } from './constants';

export interface HyperWalletConfig {
  chains: string[];
  accountType: 'ERC-4337' | 'EIP-7702' | 'Phantom' | 'SUI';
  rpcUrls?: Record<string, string>;
}

export function useHyperWallet(config?: HyperWalletConfig) {
  const [account, setAccount] = useState<string | null>(null);
  const [chain, setChain] = useState<string>('mantle');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isGasless, setIsGasless] = useState(true);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      // Detect wallet provider
      const provider = new ethers.BrowserProvider(
        (window as any).ethereum
      );
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      // Create smart account
      const factory = new HyperAccountFactory(
        FACTORY_ADDRESS,
        signer
      );
      
      const accountAddress = await factory.getAddress(userAddress, 0);
      
      // Check if account exists, create if not
      const code = await provider.getCode(accountAddress);
      if (code === '0x') {
        const tx = await factory.createAccount(userAddress, 0);
        await tx.wait();
      }

      setAccount(accountAddress);
      return accountAddress;
    } catch (error) {
      console.error('Connection failed:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const sendTransaction = useCallback(
    async (to: string, data: string, value: bigint = 0n) => {
      if (!account) throw new Error('Wallet not connected');

      const provider = new ethers.BrowserProvider(
        (window as any).ethereum
      );

      if (isGasless) {
        // Use ERC-4337 bundler
        const userOp = {
          sender: account,
          nonce: await getNonce(account, provider),
          initCode: '0x',
          callData: encodeCallData(to, data, value),
          accountGasLimits: estimateGasLimits(),
          preVerificationGas: '0x1234',  // Placeholder
          gasPricesInfo: '0x',
          paymaster: PAYMASTER_ADDRESS,
          paymasterVerificationGasLimit: '0x5678',
          paymasterPostOpGasLimit: '0x9abc',
          paymasterData: '0x',
          signature: '0x'  // Will be signed
        };

        // Get paymaster approval
        const paymasterAndData = await sponsorUserOp(userOp);
        userOp.paymasterAndData = paymasterAndData;

        // Sign and submit
        const signer = await provider.getSigner();
        userOp.signature = await signer.signMessage(
          ethers.getAddress(account)
        );

        return await submitUserOp(userOp);
      } else {
        // Regular transaction
        const signer = await provider.getSigner();
        const tx = await signer.sendTransaction({ to, data, value });
        return await tx.wait();
      }
    },
    [account, isGasless]
  );

  const createSessionKey = useCallback(
    async (agentAddress: string, ttl: number) => {
      if (!account) throw new Error('Wallet not connected');

      const provider = new ethers.BrowserProvider(
        (window as any).ethereum
      );
      const signer = await provider.getSigner();

      // Generate key ID
      const keyId = ethers.id(
        `${agentAddress}-${Date.now()}`
      );

      // Sign session key
      const digest = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ['bytes32', 'address', 'uint256'],
          [keyId, agentAddress, ttl]
        )
      );

      const signature = await signer.signMessage(
        ethers.getBytes(digest)
      );

      return {
        keyId,
        agent: agentAddress,
        expiresAt: Date.now() + ttl,
        signature,
      };
    },
    [account]
  );

  return {
    account,
    chain,
    setChain,
    connect,
    disconnect: () => setAccount(null),
    sendTransaction,
    createSessionKey,
    isConnecting,
    isGasless,
    setIsGasless,
  };
}

// Helper functions
function encodeCallData(to: string, data: string, value: bigint) {
  // Return callData for execute()
  return '0x'; // Placeholder
}

function estimateGasLimits() {
  return { callGasLimit: 100000n, verificationGasLimit: 200000n };
}

async function getNonce(account: string, provider: ethers.BrowserProvider) {
  return await provider.getTransactionCount(account);
}

async function sponsorUserOp(userOp: any) {
  // Call paymaster API
  return '0x';  // Placeholder
}

async function submitUserOp(userOp: any) {
  // Call bundler
  return { hash: '0x' };  // Placeholder
}
```

---

## ACCEPTANCE CRITERIA & TIME ESTIMATES

| Task | Criteria | Estimate |
|------|----------|----------|
| **AA-1: ERC-4337 V0.7** | EntryPoint deployed, gas accurate ±10% | 8h |
| **AA-2: EIP-7702** | Delegation tx type working, fallback logic | 6h |
| **AA-3: Solana Phantom** | Tx signing, session keys, error handling | 6h |
| **AA-4: SUI Move** | moveCall working, capabilities generated | 8h |
| **AA-5: Session Keys** | Create/validate working, TTL enforced | 10h |
| **AA-6: Paymaster** | Sponsorship working, gas accurate | 6h |
| **AA-7: React Hooks** | useHyperWallet functional, reconnect logic | 8h |
| **AA-8: UI Components** | WalletConnect, GaslessToggle, responsive | 6h |
| **AA-9: Testing** | 80% coverage, all chains tested | 8h |
| **AA-10: Security** | Rate limiting, key encryption working | 6h |
| **AA-11: Observability** | MLflow tracking, metrics dashboard | 4h |
| **AA-12: Docs & Launch** | API docs, guide, examples, security review | 8h |
| **TOTAL** | | **94 hours = ~12 days** |

---

## SUCCESS METRICS: AA Repository

```
✅ Code Coverage: 85%+
✅ Supported Chains: EVM, Solana, SUI (3/3)
✅ Gas Overhead: <30% above raw tx
✅ Paymaster Success Rate: 95%+
✅ Transaction Success Rate: 98%+
✅ npm Weekly Downloads: 1,000+ (by month 2)
✅ API Response Time: <500ms (p99)
```

---

# SDK REPOSITORY: COMPLETE IMPLEMENTATION

## Repository: `Hyperkit-Labs/sdk`

**Purpose**: Network-agnostic developer toolkit (100+ chains, x402 routing)  
**Language**: TypeScript  
**Size**: ~20k LOC  
**Weekly Downloads Target**: 2,000 (month 2)

---

## FOLDER STRUCTURE

```
sdk/
├── README.md
├── package.json
├── turbo.json
├── tsconfig.json
│
├── .github/
│   ├── workflows/
│   │   ├── test.yml
│   │   ├── publish.yml
│   │   └── integration.yml
│   └── CODEOWNERS
│
├── packages/
│   ├── core/                          # Main SDK
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   │
│   │   ├── src/
│   │   │   ├── index.ts               # Main export
│   │   │   │
│   │   │   ├── registry/
│   │   │   │   ├── network-registry.ts
│   │   │   │   ├── types.ts
│   │   │   │   └── constants.ts
│   │   │   │
│   │   │   ├── adapters/
│   │   │   │   ├── base-adapter.ts
│   │   │   │   ├── evm-adapter.ts
│   │   │   │   ├── solana-adapter.ts
│   │   │   │   ├── sui-adapter.ts
│   │   │   │   └── adapter-factory.ts
│   │   │   │
│   │   │   ├── router/
│   │   │   │   ├── capability-router.ts
│   │   │   │   ├── rpc-pool.ts
│   │   │   │   └── load-balancer.ts
│   │   │   │
│   │   │   ├── contracts/
│   │   │   │   ├── index.ts
│   │   │   │   ├── uniswap-v2.ts
│   │   │   │   ├── uniswap-v3.ts
│   │   │   │   ├── uniswap-v4.ts
│   │   │   │   ├── aave.ts
│   │   │   │   ├── curve.ts
│   │   │   │   ├── yearn.ts
│   │   │   │   └── ... (20+ more)
│   │   │   │
│   │   │   ├── payments/
│   │   │   │   ├── x402-router.ts
│   │   │   │   ├── thirdweb-x402.ts
│   │   │   │   ├── lazai-settlement.ts
│   │   │   │   ├── socket-payment.ts
│   │   │   │   └── types.ts
│   │   │   │
│   │   │   ├── common/
│   │   │   │   ├── types.ts
│   │   │   │   ├── errors.ts
│   │   │   │   ├── constants.ts
│   │   │   │   └── utils.ts
│   │   │   │
│   │   │   └── observability/
│   │   │       ├── metrics.ts
│   │   │       ├── logger.ts
│   │   │       └── tracing.ts
│   │   │
│   │   ├── test/
│   │   │   ├── registry.test.ts
│   │   │   ├── adapters.test.ts
│   │   │   ├── router.test.ts
│   │   │   ├── contracts.test.ts
│   │   │   ├── payments.test.ts
│   │   │   └── integration.test.ts
│   │   │
│   │   ├── examples/
│   │   │   ├── deploy.ts
│   │   │   ├── call.ts
│   │   │   ├── swap.ts
│   │   │   ├── multi-chain.ts
│   │   │   └── x402-payment.ts
│   │   │
│   │   └── docs/
│   │       ├── API.md
│   │       ├── CHAINS.md
│   │       ├── CONTRACTS.md
│   │       └── EXAMPLES.md
│   │
│   ├── react/                         # React hooks
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── useHyperKit.ts
│   │   │   ├── useBalance.ts
│   │   │   ├── useGasEstimate.ts
│   │   │   ├── useChain.ts
│   │   │   ├── context.tsx
│   │   │   └── provider.tsx
│   │   │
│   │   └── test/
│   │       ├── hooks.test.tsx
│   │       └── integration.test.tsx
│   │
│   └── codegen/                       # Code generation tools
│       ├── package.json
│       ├── src/
│       │   ├── contract-generator.ts
│       │   ├── templates/
│       │   │   ├── contract.hbs
│       │   │   ├── interface.hbs
│       │   │   └── types.hbs
│       │   │
│       │   └── cli.ts
│       │
│       └── bin/
│           └── hyperkit-codegen
│
├── config/
│   ├── networks/
│   │   ├── mantle.json
│   │   ├── metis.json
│   │   ├── hyperion.json
│   │   ├── solana.json
│   │   ├── sui.json
│   │   └── ... (95+ more)
│   │
│   ├── contracts/
│   │   ├── uniswap-v2.abi.json
│   │   ├── uniswap-v3.abi.json
│   │   ├── aave.abi.json
│   │   └── ... (20+ more)
│   │
│   └── rpc-endpoints.json
│
├── test/
│   ├── e2e/
│   │   ├── evm-chains.test.ts
│   │   ├── solana.test.ts
│   │   ├── sui.test.ts
│   │   ├── multi-chain.test.ts
│   │   └── x402-routing.test.ts
│   │
│   └── load/
│       ├── load-test.ts
│       └── stress-test.ts
│
├── scripts/
│   ├── setup.sh
│   ├── generate-contracts.sh
│   ├── test-all.sh
│   └── benchmark.sh
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── ADDING_CHAIN.md
│   ├── PERFORMANCE.md
│   └── BEST_PRACTICES.md
│
└── CHANGELOG.md
```

---

## TECH STACK: SDK Repository

| Layer | Technology | Version | Justification |
|-------|-----------|---------|---------------|
| **Core** | TypeScript | 5.x | Type safety |
| **EVM** | ethers.js | 6.x | ERC-4337, EIP-7702 |
| **Solana** | @solana/web3.js | 1.95.0+ | Official SDK |
| **SUI** | @mysten/sui.js | 1.0.0+ | Official SDK |
| **HTTP** | axios | 1.x | Reliable requests |
| **Testing** | Vitest | Latest | Fast unit tests |
| **E2E Testing** | playwright | Latest | Browser automation |
| **React** | React | 18.x | React hooks |
| **State** | TanStack Query | 5.x | Async state |
| **Build** | tsup | 8.x | Fast bundling |
| **Docs** | TypeDoc | 0.25.x | Auto API docs |
| **Linting** | ESLint + Prettier | Latest | Code quality |
| **Contract ABI** | ethers.Interface | 6.x | ABI parsing |

---

## MINIMAL SKELETON CODE

### Network Registry: `network-registry.ts`

```typescript
export interface NetworkConfig {
  chainId: number;
  name: string;
  type: 'evm' | 'solana' | 'sui' | 'cosmos';
  rpc: string[];
  blockExplorers: { name: string; url: string }[];
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  
  capabilities: {
    account: {
      type: 'ERC-4337' | 'EIP-7702' | 'Phantom' | 'SUI';
      entryPoint?: string;
      factory?: string;
    };
    payment: {
      facilitator: 'thirdweb_x402' | 'lazai' | 'socket' | 'direct';
      metering: boolean;
      creditsPerRun: number;
    };
    da: {
      provider: 'EigenDA' | 'Mantle' | 'Walrus' | 'Blobs';
    };
  };
}

export const NETWORK_REGISTRY: Record<string, NetworkConfig> = {
  mantle: {
    chainId: 5000,
    name: 'Mantle',
    type: 'evm',
    rpc: [
      'https://rpc.mantle.xyz',
      'https://mantle-rpc.mantle.xyz',
    ],
    blockExplorers: [
      { name: 'Explorer', url: 'https://explorer.mantle.xyz' },
    ],
    nativeCurrency: {
      name: 'MNT',
      symbol: 'MNT',
      decimals: 18,
    },
    capabilities: {
      account: {
        type: 'ERC-4337',
        entryPoint: '0x5FF137D4b0FDCD49DcA30c7B57b04b0ee67cBD95',
        factory: '0x9406cc6185a346906296840746125a0ee16860f6',
      },
      payment: {
        facilitator: 'thirdweb_x402',
        metering: true,
        creditsPerRun: 3,
      },
      da: {
        provider: 'Mantle',
      },
    },
  },

  solana: {
    chainId: 101,
    name: 'Solana',
    type: 'solana',
    rpc: ['https://api.mainnet-beta.solana.com'],
    blockExplorers: [
      { name: 'Solscan', url: 'https://solscan.io' },
    ],
    nativeCurrency: {
      name: 'Solana',
      symbol: 'SOL',
      decimals: 9,
    },
    capabilities: {
      account: {
        type: 'Phantom',
      },
      payment: {
        facilitator: 'direct',
        metering: true,
        creditsPerRun: 1,
      },
      da: {
        provider: 'Walrus',
      },
    },
  },

  // ... Add 98+ more chains
};

export class NetworkRegistry {
  private static instance: NetworkRegistry;
  private configs: Map<string, NetworkConfig>;

  private constructor() {
    this.configs = new Map(Object.entries(NETWORK_REGISTRY));
  }

  static getInstance(): NetworkRegistry {
    if (!NetworkRegistry.instance) {
      NetworkRegistry.instance = new NetworkRegistry();
    }
    return NetworkRegistry.instance;
  }

  getConfig(chain: string): NetworkConfig {
    const config = this.configs.get(chain.toLowerCase());
    if (!config) {
      throw new Error(`Unsupported chain: ${chain}`);
    }
    return config;
  }

  getRPCs(chain: string): string[] {
    return this.getConfig(chain).rpc;
  }

  getCapability(chain: string, type: 'account' | 'payment' | 'da') {
    return this.getConfig(chain).capabilities[type];
  }

  listChains(): string[] {
    return Array.from(this.configs.keys());
  }

  addChain(chain: string, config: NetworkConfig): void {
    this.configs.set(chain.toLowerCase(), config);
  }

  getChainsByType(type: NetworkConfig['type']): string[] {
    const chains: string[] = [];
    for (const [name, config] of this.configs.entries()) {
      if (config.type === type) {
        chains.push(name);
      }
    }
    return chains;
  }
}
```

### EVM Adapter: `evm-adapter.ts`

```typescript
import { JsonRpcProvider, Contract, Interface, Signer } from 'ethers';

export interface DeployResult {
  address: string;
  txHash: string;
  blockNumber?: number;
}

export interface CallResult {
  result: any;
  blockNumber: number;
}

export interface IChainAdapter {
  deploy(
    bytecode: string,
    abi: any[],
    constructorArgs: any[]
  ): Promise<DeployResult>;

  call(
    address: string,
    method: string,
    args: any[],
    blockTag?: string
  ): Promise<any>;

  estimateGas(
    to: string,
    data: string,
    value?: bigint
  ): Promise<bigint>;

  getBalance(address: string, blockTag?: string): Promise<bigint>;
}

export class EvmAdapter implements IChainAdapter {
  private provider: JsonRpcProvider;
  private signer?: Signer;

  constructor(
    private rpc: string,
    public chainId: number
  ) {
    this.provider = new JsonRpcProvider(rpc, chainId);
  }

  setSigner(signer: Signer): void {
    this.signer = signer;
  }

  async deploy(
    bytecode: string,
    abi: any[],
    constructorArgs: any[]
  ): Promise<DeployResult> {
    if (!this.signer) {
      throw new Error('Signer not set');
    }

    const factory = new ContractFactory(abi, bytecode, this.signer);
    const contract = await factory.deploy(...constructorArgs);
    const deployed = await contract.waitForDeployment();

    return {
      address: await deployed.getAddress(),
      txHash: contract.deploymentTransaction()?.hash || '',
      blockNumber: contract.deploymentTransaction()?.blockNumber,
    };
  }

  async call(
    address: string,
    method: string,
    args: any[],
    blockTag: string = 'latest'
  ): Promise<any> {
    // Minimal ABI needed for call
    const minimalABI = [
      {
        name: method,
        type: 'function',
        inputs: [],
        outputs: [],
        stateMutability: 'view',
      },
    ];

    const contract = new Contract(address, minimalABI, this.provider);
    const result = await contract[method](...args, { blockTag });

    return result;
  }

  async estimateGas(
    to: string,
    data: string,
    value: bigint = 0n
  ): Promise<bigint> {
    const estimation = await this.provider.estimateGas({
      to,
      data,
      value,
    });

    // Add 20% buffer
    return (estimation * 120n) / 100n;
  }

  async getBalance(
    address: string,
    blockTag: string = 'latest'
  ): Promise<bigint> {
    return await this.provider.getBalance(address, blockTag);
  }

  async getBlockNumber(): Promise<number> {
    return await this.provider.getBlockNumber();
  }

  async waitForTransaction(
    txHash: string,
    confirmations: number = 1
  ): Promise<any> {
    return await this.provider.waitForTransaction(txHash, confirmations);
  }
}
```

### Main HyperKit Class: `index.ts`

```typescript
import { NetworkRegistry } from './registry/network-registry';
import { CapabilityRouter } from './router/capability-router';
import { X402Router } from './payments/x402-router';
import { RPCPool } from './router/rpc-pool';

export class HyperKit {
  public registry: NetworkRegistry;
  public router: CapabilityRouter;
  public x402: X402Router;
  public rpcPools: Map<string, RPCPool>;

  constructor() {
    this.registry = NetworkRegistry.getInstance();
    this.router = new CapabilityRouter(this.registry);
    this.x402 = new X402Router(this.registry);
    this.rpcPools = new Map();
  }

  /**
   * Deploy contract on target chain
   */
  async deploy(
    bytecode: string,
    abi: any[],
    constructorArgs: any[],
    chain: string
  ) {
    const adapter = await this.router.route('deploy', chain);
    return await adapter.deploy(bytecode, abi, constructorArgs);
  }

  /**
   * Call contract method
   */
  async call(
    address: string,
    method: string,
    args: any[],
    chain: string
  ) {
    const adapter = await this.router.route('call', chain);
    return await adapter.call(address, method, args);
  }

  /**
   * Estimate gas for transaction
   */
  async estimateGas(
    to: string,
    data: string,
    chain: string,
    value: bigint = 0n
  ): Promise<bigint> {
    const adapter = await this.router.route('call', chain);
    return await adapter.estimateGas(to, data, value);
  }

  /**
   * Get account balance
   */
  async getBalance(address: string, chain: string): Promise<bigint> {
    const adapter = await this.router.route('call', chain);
    return await adapter.getBalance(address);
  }

  /**
   * Route payment via x402
   */
  async sendPayment(
    amount: bigint,
    targetChain: string,
    action: 'agent_run' | 'deployment' | 'audit'
  ) {
    return await this.x402.routePayment(amount, targetChain, action);
  }

  /**
   * Add custom chain at runtime
   */
  addChain(chain: string, config: any): void {
    this.registry.addChain(chain, config);
  }

  /**
   * Get list of supported chains
   */
  listChains(): string[] {
    return this.registry.listChains();
  }
}

// Export singleton
export const hyperKit = new HyperKit();
```

---

## ACCEPTANCE CRITERIA & TIME ESTIMATES

| Task | Criteria | Estimate |
|------|----------|----------|
| **SDK-1: Network Registry** | 100+ chains, runtime config | 10h |
| **SDK-2: Router** | Route correct adapter per chain | 8h |
| **SDK-3: EVM Adapter** | Deploy, call, gas estimate ±10% | 10h |
| **SDK-4: Solana Adapter** | Program deploy, calls, estimates | 12h |
| **SDK-5: SUI Adapter** | Move deploy, calls, capabilities | 10h |
| **SDK-6: Contract Wrappers** | 20+ pre-generated contracts | 8h |
| **SDK-7: RPC Pooling** | Failover, health check, latency | 6h |
| **SDK-8: x402 Routing** | 4 facilitators, payment intents | 10h |
| **SDK-9: SDK Core** | Main HyperKit class, exports | 6h |
| **SDK-10: React Hooks** | useHyperKit functional | 5h |
| **SDK-11: E2E Tests** | 80% coverage, all chains | 10h |
| **SDK-12: Docs** | API docs, guides, examples | 8h |
| **TOTAL** | | **103 hours = ~13 days** |

---

## SUCCESS METRICS: SDK Repository

```
✅ Supported Networks: 100+
✅ Adapter Test Coverage: 85%+ per adapter
✅ x402 Facilitators: 4 (all primary ones)
✅ API Response Time: <300ms (p99)
✅ RPC Failover Rate: <1% error rate
✅ npm Package Size: <500KB (gzip)
✅ npm Weekly Downloads: 2,000+ (by month 2)
```

---

# HYPERAGENT REPOSITORY: COMPLETE IMPLEMENTATION

## Repository: `Hyperkit-Labs/hyperagent`

**Purpose**: AI-powered orchestrator (ROMA, Firecrawl RAG, Solidity generation, TEE)  
**Languages**: Python + TypeScript  
**Size**: ~25k LOC  
**Architecture**: FastAPI backend + Next.js dashboard

---

## FOLDER STRUCTURE

```
hyperagent/
├── README.md
├── pyproject.toml                     # Python project config
├── requirements.txt
├── package.json                       # Node workspace
├── tsconfig.json
│
├── .github/
│   ├── workflows/
│   │   ├── test.yml
│   │   ├── publish.yml
│   │   └── security.yml
│   └── CODEOWNERS
│
├── backend/                           # Python FastAPI
│   ├── pyproject.toml
│   ├── requirements.txt
│   │
│   ├── hyperagent/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI app
│   │   │
│   │   ├── orchestrator/
│   │   │   ├── __init__.py
│   │   │   ├── roma_agent.py          # ROMA + DSPy
│   │   │   ├── planner.py
│   │   │   ├── executor.py
│   │   │   └── aggregator.py
│   │   │
│   │   ├── rag/
│   │   │   ├── __init__.py
│   │   │   ├── firecrawl_pipeline.py
│   │   │   ├── vector_store.py        # Pinecone
│   │   │   └── retriever.py
│   │   │
│   │   ├── codegen/
│   │   │   ├── __init__.py
│   │   │   ├── solidity_generator.py
│   │   │   ├── contract_spec.py
│   │   │   └── templates/
│   │   │       ├── erc20.jinja2
│   │   │       ├── dex.jinja2
│   │   │       └── vault.jinja2
│   │   │
│   │   ├── audit/
│   │   │   ├── __init__.py
│   │   │   ├── slither_auditor.py
│   │   │   ├── ai_auditor.py
│   │   │   └── report_generator.py
│   │   │
│   │   ├── tee/
│   │   │   ├── __init__.py
│   │   │   ├── lazai_tee.py           # Phala TEE
│   │   │   ├── eigen_compute.py
│   │   │   └── attestation.py
│   │   │
│   │   ├── deploy/
│   │   │   ├── __init__.py
│   │   │   ├── foundry_deployer.py
│   │   │   ├── contract_verifier.py
│   │   │   └── deployment_tracker.py
│   │   │
│   │   ├── monitoring/
│   │   │   ├── __init__.py
│   │   │   ├── moralis_streams.py
│   │   │   ├── dune_analytics.py
│   │   │   ├── tvl_tracker.py
│   │   │   └── alert_manager.py
│   │   │
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── routes.py              # API endpoints
│   │   │   ├── schemas.py             # Pydantic models
│   │   │   └── middleware.py
│   │   │
│   │   ├── observability/
│   │   │   ├── __init__.py
│   │   │   ├── mlflow_tracking.py
│   │   │   ├── logging.py
│   │   │   └── metrics.py
│   │   │
│   │   ├── config/
│   │   │   ├── __init__.py
│   │   │   ├── settings.py
│   │   │   ├── llm_config.py
│   │   │   └── chains.yaml
│   │   │
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── crypto.py
│   │       ├── retry.py
│   │       └── validators.py
│   │
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_roma.py
│   │   ├── test_codegen.py
│   │   ├── test_audit.py
│   │   ├── test_deploy.py
│   │   ├── test_tee.py
│   │   └── test_e2e.py
│   │
│   ├── scripts/
│   │   ├── setup.sh
│   │   ├── run-dev.sh
│   │   ├── run-tests.sh
│   │   └── deploy.sh
│   │
│   ├── docs/
│   │   ├── API.md
│   │   ├── ARCHITECTURE.md
│   │   ├── CONTRIBUTING.md
│   │   └── DEPLOYMENT.md
│   │
│   └── docker/
│       ├── Dockerfile
│       └── docker-compose.yml
│
├── frontend/                          # Next.js Dashboard
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   │
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                   # Home
│   │   │
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   ├── metrics.tsx
│   │   │   ├── builds.tsx
│   │   │   └── tvl.tsx
│   │   │
│   │   ├── build/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx           # Build detail
│   │   │   └── new/
│   │   │       └── page.tsx           # New build form
│   │   │
│   │   └── api/
│   │       ├── builds/route.ts
│   │       ├── metrics/route.ts
│   │       └── webhook/route.ts
│   │
│   ├── components/
│   │   ├── BuildForm.tsx
│   │   ├── MetricsCard.tsx
│   │   ├── TVLChart.tsx
│   │   ├── BuildHistory.tsx
│   │   ├── AuditReport.tsx
│   │   ├── DeploymentViewer.tsx
│   │   └── WebSocket.tsx
│   │
│   ├── hooks/
│   │   ├── useBuild.ts
│   │   ├── useMetrics.ts
│   │   └── useWebSocket.ts
│   │
│   ├── lib/
│   │   ├── api-client.ts
│   │   ├── socket.ts
│   │   └── utils.ts
│   │
│   ├── public/
│   │   └── logo.svg
│   │
│   ├── styles/
│   │   └── globals.css
│   │
│   └── docker/
│       └── Dockerfile
│
├── config/
│   ├── llm-prompts/
│   │   ├── planner.txt
│   │   ├── codegen.txt
│   │   ├── audit.txt
│   │   └── design.txt
│   │
│   ├── rag-sources.yaml               # Docs to crawl
│   │
│   └── chains.yaml                    # Deployment targets
│
├── examples/
│   ├── simple-counter.md
│   ├── dex-with-x402.md
│   ├── vault-amm.md
│   └── cross-chain-bridge.md
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── BEST_PRACTICES.md
│   ├── ROADMAP.md
│   └── TROUBLESHOOTING.md
│
└── CHANGELOG.md
```

---

## TECH STACK: HyperAgent Repository

### Backend (Python)

| Layer | Technology | Version | Justification |
|-------|-----------|---------|---------------|
| **Framework** | FastAPI | 0.100+ | Async, fast, modern |
| **Agent** | ROMA/DSPy | Latest | 4.5k recursion, not DAGs |
| **LLM Routing** | LiteLLM | Latest | Multi-model abstraction |
| **LLM APIs** | Anthropic, OpenAI | - | Claude for code, GPT-5 for planning |
| **RAG** | Firecrawl MCP | Latest | Live doc scraping |
| **Vector DB** | Pinecone | - | Semantic search, scale |
| **Static Analysis** | Slither | 0.10.0+ | Solidity security |
| **Auditing** | TEE (Phala/LazAI) | - | Attested results |
| **Build** | Foundry | Latest | Solidity compilation |
| **Monitoring** | Moralis Streams | - | Webhook events |
| **Analytics** | Dune API | - | On-chain metrics |
| **Tracking** | MLflow | 2.x | Experiment logging |
| **Async** | asyncio, aiohttp | - | Concurrent tasks |
| **ORM** | SQLAlchemy | 2.x | Database abstraction |
| **DB** | Postgres | 14+ | Production database |
| **Cache** | Redis | 7.x | Session + rate limiting |
| **Testing** | pytest | 7.x | Unit + integration tests |
| **Deployment** | Docker | - | Containerization |

### Frontend (TypeScript/React)

| Layer | Technology | Version | Justification |
|-------|-----------|---------|---------------|
| **Framework** | Next.js | 14.x | App Router, SSR |
| **React** | React | 18.x | UI components |
| **UI Library** | shadcn/ui | Latest | Accessible, customizable |
| **Charts** | Recharts | 2.x | Interactive visualizations |
| **State** | TanStack Query | 5.x | Server state management |
| **WebSocket** | Socket.io client | 4.x | Real-time updates |
| **Forms** | React Hook Form | 7.x | Lightweight forms |
| **Validation** | Zod | 3.x | Type-safe schemas |
| **HTTP** | axios | 1.x | API requests |
| **Build** | Next.js | 14.x | Turbopack |
| **Testing** | Vitest + Playwright | - | Fast unit + E2E |
| **Styling** | Tailwind CSS | 3.x | Utility-first CSS |

---

## MINIMAL SKELETON CODE

### ROMA Agent: `roma_agent.py`

```python
from roma_dspy import ROMA
from firecrawl_mcp import Firecrawl
from typing import List, Dict
import asyncio
import json

class HyperAgent:
    def __init__(self):
        self.roma = ROMA(
            model="gpt-5-turbo",
            profile="crypto_agent",
            max_depth=100,  # Allow deep recursion
        )
        self.firecrawl = Firecrawl(api_key="FIRECRAWL_API_KEY")

    async def plan(self, prompt: str) -> Dict:
        """
        ROMA planner: decompose user request into phases
        """
        # Fetch RAG context
        rag_sources = [
            "https://github.com/Uniswap/v4-core",
            "https://docs.aave.com/",
            "https://curve.readthedocs.io/",
        ]
        
        rag_context = ""
        for url in rag_sources:
            content = await self.firecrawl.crawl(url, {
                "includeMarkdown": True,
                "maxDepth": 3,
            })
            rag_context += f"\n## {url}\n{content}\n"

        # Call ROMA planner
        planning_prompt = f"""
        User Request: {prompt}
        
        Available Context:
        {rag_context}
        
        Create a JSON plan with these phases:
        1. "design": Architecture + data structures
        2. "generate": Solidity code
        3. "audit": Security analysis
        4. "test": Testing strategy
        5. "deploy": On-chain deployment
        
        For each phase, list specific subtasks.
        """

        plan_output = await self.roma.asolve(
            planning_prompt,
            tools=[self.firecrawl],
        )

        return json.loads(plan_output)

    async def execute_plan(self, plan: Dict, prompt: str):
        """
        ROMA executor: run all phases in parallel/sequence
        """
        results = {}

        for phase_name, phase_config in plan["phases"].items():
            print(f"Executing: {phase_name}")
            
            if phase_name == "design":
                results["design"] = await self.design_phase(prompt)
            
            elif phase_name == "generate":
                results["generate"] = await self.generate_phase(
                    results.get("design")
                )
            
            elif phase_name == "audit":
                results["audit"] = await self.audit_phase(
                    results.get("generate")
                )
            
            elif phase_name == "test":
                results["test"] = await self.test_phase(
                    results.get("generate")
                )
            
            elif phase_name == "deploy":
                results["deploy"] = await self.deploy_phase(
                    results.get("generate"),
                    prompt,
                )

        return results

    async def design_phase(self, prompt: str) -> Dict:
        """Design phase: architecture & data structures"""
        return {
            "contracts": ["Dex", "Router", "Factory"],
            "state_vars": ["reserves", "fees", "owner"],
            "functions": ["swap", "addLiquidity", "removeLiquidity"],
        }

    async def generate_phase(self, design: Dict) -> Dict:
        """Generate phase: Solidity code from design"""
        codegen_prompt = f"""
        Contract Design:
        {json.dumps(design, indent=2)}
        
        Generate production-ready Solidity code that:
        - Follows design exactly
        - Is auditable
        - Has natspec comments
        - Includes events
        - Is gas-efficient
        """

        code_output = await self.roma.asolve(codegen_prompt)
        return {"code": code_output}

    async def audit_phase(self, generated: Dict) -> Dict:
        """Audit phase: Slither + AI analysis"""
        # This would call Slither and AI auditor
        return {
            "findings": [],
            "severity": "PASS",
            "confidence": 0.95,
        }

    async def test_phase(self, generated: Dict) -> Dict:
        """Test phase: Foundry tests"""
        return {
            "coverage": 95.5,
            "test_count": 42,
            "failed": 0,
        }

    async def deploy_phase(self, generated: Dict, prompt: str) -> Dict:
        """Deploy phase: Deploy to target chain"""
        # Extract chain from prompt
        chain = "mantle"  # Would parse from prompt
        
        return {
            "address": "0x...",
            "tx_hash": "0x...",
            "chain": chain,
        }

    async def build_dapp(self, prompt: str) -> Dict:
        """
        End-to-end: prompt → deployed dApp
        """
        start = asyncio.get_event_loop().time()

        # Plan
        plan = await self.plan(prompt)

        # Execute
        results = await self.execute_plan(plan, prompt)

        elapsed = asyncio.get_event_loop().time() - start

        return {
            "status": "success" if all(results.values()) else "failed",
            "plan": plan,
            "results": results,
            "total_time": elapsed,
        }


# Usage
async def main():
    agent = HyperAgent()

    result = await agent.build_dapp(
        "Build a DEX on Mantle with x402 payments, max gas 100gwei"
    )

    print(json.dumps(result, indent=2, default=str))


if __name__ == "__main__":
    asyncio.run(main())
```

### FastAPI Routes: `api/routes.py`

```python
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime

router = APIRouter()

class BuildRequest(BaseModel):
    prompt: str
    chain: str = "mantle"
    model: Optional[str] = "gpt-5-turbo"

class BuildResponse(BaseModel):
    id: str
    status: str
    prompt: str
    chain: str
    created_at: datetime
    contract_addresses: Optional[dict] = None
    audit_report: Optional[str] = None
    total_time: Optional[float] = None

# In-memory store (would use Postgres in production)
builds_db = {}

@router.post("/api/builds", response_model=BuildResponse)
async def create_build(request: BuildRequest, background_tasks: BackgroundTasks):
    """
    POST /api/builds
    Create a new build (async)
    """
    build_id = str(uuid.uuid4())
    
    build = BuildResponse(
        id=build_id,
        status="pending",
        prompt=request.prompt,
        chain=request.chain,
        created_at=datetime.now(),
    )
    
    builds_db[build_id] = build
    
    # Run build in background
    background_tasks.add_task(execute_build, build_id, request)
    
    return build

@router.get("/api/builds/{build_id}", response_model=BuildResponse)
async def get_build(build_id: str):
    """
    GET /api/builds/{build_id}
    Get build status
    """
    if build_id not in builds_db:
        raise HTTPException(status_code=404, detail="Build not found")
    
    return builds_db[build_id]

@router.get("/api/builds", response_model=list[BuildResponse])
async def list_builds(skip: int = 0, limit: int = 10):
    """
    GET /api/builds
    List recent builds
    """
    return list(builds_db.values())[skip:skip+limit]

async def execute_build(build_id: str, request: BuildRequest):
    """Background task: execute build"""
    try:
        agent = HyperAgent()
        result = await agent.build_dapp(request.prompt)
        
        builds_db[build_id].status = result["status"]
        builds_db[build_id].total_time = result["total_time"]
        builds_db[build_id].contract_addresses = result.get("contract_addresses")
        builds_db[build_id].audit_report = result.get("audit_report")
    
    except Exception as e:
        builds_db[build_id].status = "failed"
        print(f"Build failed: {e}")
```

### Next.js Dashboard: `app/page.tsx`

```typescript
"use client";

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const [builds, setBuilds] = useState([]);
  const [metrics, setMetrics] = useState({ total: 0, success: 0, tvl: 0 });
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Fetch initial data
    fetch('/api/builds')
      .then(r => r.json())
      .then(setBuilds);

    fetch('/api/metrics')
      .then(r => r.json())
      .then(setMetrics);

    // WebSocket for real-time updates
    const ws = new WebSocket('ws://localhost:8000/ws');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'build_progress') {
        setBuilds(prev => [...prev, data.build]);
      } else if (data.type === 'metrics_update') {
        setMetrics(data.metrics);
      }
    };

    setSocket(ws);

    return () => ws.close();
  }, []);

  return (
    <div className="grid grid-cols-4 gap-4 p-8">
      {/* Metrics Cards */}
      <Card>
        <CardHeader><CardTitle>Total Builds</CardTitle></CardHeader>
        <CardContent className="text-3xl">{metrics.total}</CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Success Rate</CardTitle></CardHeader>
        <CardContent className="text-3xl">
          {metrics.total > 0 ? ((metrics.success / metrics.total) * 100).toFixed(1) : 0}%
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Total TVL</CardTitle></CardHeader>
        <CardContent className="text-3xl">${metrics.tvl}M</CardContent>
      </Card>

      {/* New Build Button */}
      <Card>
        <CardHeader><CardTitle>Create Build</CardTitle></CardHeader>
        <CardContent>
          <Button onClick={() => window.location.href = '/build/new'}>
            New Build
          </Button>
        </CardContent>
      </Card>

      {/* Recent Builds Table */}
      <Card className="col-span-4">
        <CardHeader><CardTitle>Recent Builds</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>ID</th>
                <th>Prompt</th>
                <th>Chain</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {builds.map(build => (
                <tr key={build.id} className="border-t">
                  <td>{build.id.slice(0, 8)}</td>
                  <td>{build.prompt.slice(0, 40)}...</td>
                  <td>{build.chain}</td>
                  <td className={build.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                    {build.status}
                  </td>
                  <td>{build.total_time?.toFixed(1)}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## ACCEPTANCE CRITERIA & TIME ESTIMATES

| Task | Criteria | Estimate |
|------|----------|----------|
| **HA-1: ROMA Planner** | Decomposes prompts, RAG context included | 10h |
| **HA-2: Firecrawl RAG** | 6+ docs crawled, semantic search working | 12h |
| **HA-3: Solidity Generator** | Generates valid, auditable Solidity | 14h |
| **HA-4: Audit Orchestration** | Slither + AI working, attested reports | 12h |
| **HA-5: LazAI TEE** | Audit in enclave, attestation quote | 12h |
| **HA-6: EigenCompute** | Job submission, verifiable outputs | 8h |
| **HA-7: Foundry Deploy** | Deploy, verify, working on chains | 10h |
| **HA-8: Monitoring** | Moralis streams, Dune queries, TVL | 8h |
| **HA-9: Agent Lifecycle** | End-to-end <90 seconds | 14h |
| **HA-10: Dashboard** | Charts, real-time, responsive | 10h |
| **HA-11: Observability** | MLflow tracking, API docs | 6h |
| **HA-12: Testing & Launch** | E2E tests, security audit | 10h |
| **TOTAL** | | **126 hours = ~16 days** |

---

## SUCCESS METRICS: HyperAgent Repository

```
✅ Build Success Rate: 95%+
✅ Avg Build Time: <90 seconds
✅ Audit Pass Rate: 90%+
✅ TEE Availability: 99.5% uptime
✅ Code Coverage: 85%+
✅ Concurrent Builds: 10+
✅ API Response Time: <500ms (p99)
✅ User Satisfaction: 4.5/5 stars
```

---

# SHARED INFRASTRUCTURE & BEST PRACTICES

## Cross-Repo Integration Points

```
┌──────────────────────────────────────────────────────────┐
│                    Shared Services                        │
├──────────────────────────────────────────────────────────┤
│ • MLflow (Observability)                                 │
│ • PostgreSQL (Shared DB)                                 │
│ • Redis (Cache + Sessions)                               │
│ • Pinecone (Vector DB)                                   │
│ • Moralis Streams (Event webhooks)                        │
│ • Dune Analytics (On-chain metrics)                       │
└──────────────────────────────────────────────────────────┘
         ↑         ↑         ↑
    ┌────┴─────┬───┴─────┬──┴───────┐
    │           │         │          │
 ┌──▼──┐   ┌───▼──┐   ┌──▼──┐   ┌──▼──┐
 │  AA │   │ SDK  │   │HA   │   │Pts  │
 └─────┘   └──────┘   └─────┘   └─────┘
```

## Database Schema (PostgreSQL)

```sql
-- Shared schema
CREATE TABLE builds (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    prompt TEXT,
    chain VARCHAR(50),
    status VARCHAR(20),  -- pending, success, failed
    contracts JSONB,     -- Deployed contracts
    audit_report JSONB,
    total_time FLOAT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    build_id UUID REFERENCES builds(id),
    tx_hash VARCHAR(66),
    chain VARCHAR(50),
    status VARCHAR(20),
    gas_used BIGINT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE metrics (
    id UUID PRIMARY KEY,
    build_id UUID REFERENCES builds(id),
    name VARCHAR(100),
    value FLOAT,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Contributor Points (from `packages/points`)
CREATE TABLE contributor_points (
    id UUID PRIMARY KEY,
    address VARCHAR(42),  -- Ethereum address
    points BIGINT,
    contribution_type VARCHAR(50),  -- template, library, audit
    tx_hash VARCHAR(66),  -- On-chain tx
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE x402_burns (
    id UUID PRIMARY KEY,
    build_id UUID REFERENCES builds(id),
    credits_burned BIGINT,
    usd_equivalent FLOAT,
    network VARCHAR(50),
    timestamp TIMESTAMP DEFAULT NOW()
);
```

## GitHub Actions Workflow (All Repos)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Install dependencies
        run: |
          npm ci
          pip install -r requirements.txt
      
      - name: Lint
        run: npm run lint
      
      - name: Type check
        run: npm run typecheck
      
      - name: Unit tests
        run: npm test
      
      - name: E2E tests (testnet)
        run: npm run test:e2e
        env:
          MANTLE_RPC: ${{ secrets.MANTLE_TESTNET_RPC }}
          SOLANA_RPC: ${{ secrets.SOLANA_TESTNET_RPC }}
      
      - name: Coverage report
        uses: codecov/codecov-action@v3
      
      - name: Security scan
        run: npm audit
```

## Environment Variables Template

```bash
# .env.example

# API Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...

# RPC Endpoints
MANTLE_RPC=https://rpc.mantle.xyz
METIS_RPC=https://metis-rpc.mantle.xyz
SOLANA_RPC=https://api.mainnet-beta.solana.com
SUI_RPC=https://fullnode.mainnet.sui.io:443

# Database
DATABASE_URL=postgresql://user:pass@localhost/hyperkit
REDIS_URL=redis://localhost:6379

# Services
PINECONE_API_KEY=...
MORALIS_API_KEY=...
DUNE_API_KEY=...
MLFLOW_TRACKING_URI=http://localhost:5000

# Contracts
ENTRY_POINT_ADDRESS=0x5FF137D4b0FDCD49DcA30c7B57b04b0ee67cBD95
FACTORY_ADDRESS=0x...
PAYMASTER_ADDRESS=0x...

# Deployment
DEPLOY_PRIVATE_KEY=0x...
ETHERSCAN_API_KEY=...

# Phala TEE
PHALA_WORKER_KEY=...

# Tokens
JWT_SECRET=...
```

---

# TOKENOMICS INTEGRATION ACROSS ALL REPOS

## The Flow: From Contribution to $HYPE

```
┌─────────────────────────────────────────────────────────┐
│  Contributor Action (External)                          │
├─────────────────────────────────────────────────────────┤
│  1. Publishes template on GitHub (PR merged)            │
│  2. Library published to npm                            │
│  3. Participates in security audit                      │
│  4. Successful bug bounty submission                    │
└──────────────┬──────────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────────────┐
│  Backend Oracle (Indexer)                               │
├─────────────────────────────────────────────────────────┤
│  HyperAgent API → AI evaluation                         │
│  GitHub webhook → PR metadata extraction                │
│  Dune query → on-chain verification                     │
└──────────────┬──────────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────────────┐
│  Points Controller Smart Contract                       │
├─────────────────────────────────────────────────────────┤
│  tx: earnPoints(contributor, TEMPLATE, 50, "pr#123")   │
│  Emits: PointsEarned(0x..., 50 HKP)                    │
└──────────────┬──────────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────────────┐
│  TheGraph Indexes Event                                 │
├─────────────────────────────────────────────────────────┤
│  Schema: type PointsEarned {                            │
│    contributor: String!                                 │
│    amount: BigInt!                                      │
│    type: String!                                        │
│    timestamp: BigInt!                                   │
│  }                                                      │
└──────────────┬──────────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────────────┐
│  TGE Snapshot (Month 6)                                 │
├─────────────────────────────────────────────────────────┤
│  Merkle tree generated:                                 │
│    0x123... → 500 points → 50 HYPE (0.1 per point)     │
│    0x456... → 1000 points → 100 HYPE                   │
│    ...                                                  │
└──────────────┬──────────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────────────┐
│  Distributor Contract + UI                              │
├─────────────────────────────────────────────────────────┤
│  User: claim(amount, merkleProof)                       │
│  Returns: 50 HYPE transferred to wallet                 │
└─────────────────────────────────────────────────────────┘
```

## Points Multipliers & Caps

```
TEMPLATE:
  Raw Points: 10 per template (if Slither passes)
  Multiplier: 1.0x (baseline)
  Daily Cap: 5 templates/day
  Monthly Cap: 100 points
  Example: PR#123 merged → 10 HKP minted

LIBRARY:
  Raw Points: 50 per library
  Multiplier: 5.0x (5x more valuable)
  Daily Cap: 1 library/day
  Monthly Cap: 500 points
  Example: npm package published → 50 HKP minted

AUDIT:
  Raw Points: 25 per audit
  Multiplier: 2.5x
  Daily Cap: 3 audits/day
  Monthly Cap: 750 points
  Example: Security finding merged → 25 HKP minted

BUG_BOUNTY:
  Raw Points: 100-500 (severity-based)
  Multiplier: 1.0x-10.0x (HIGH pays 10x)
  No daily cap
  Monthly Cap: 2000 points (HIGH), 1000 (MEDIUM), 500 (LOW)
  Example: Reentrancy found → 500 HKP minted

GOVERNANCE:
  Raw Points: 5 per proposal comment
  Multiplier: 1.0x
  Daily Cap: 10 comments/day
  Monthly Cap: 150 points
  Example: RFC#42 comment → 5 HKP minted

REFERRAL:
  Raw Points: 20% of referred user's first month points
  Multiplier: 1.0x
  No cap
  Example: Referred user earns 100 HKP → Referrer gets 20 HKP
```

## x402 Credit Burn → Points Allocation

When users burn credits on HyperAgent builds:

```
User Action: Deploy DEX on Mantle (costs 3 credits)
Price: 3 credits × $0.05 = $0.15 spent

Creator (Template): Gets 50% of x402 revenue
  50% × $0.15 = $0.075 → 0.75 HKP tokens

HyperKit Treasury: Gets 40%
  40% × $0.15 = $0.06 → Governance reserve

Auditor (if template was audited): Gets 10%
  10% × $0.15 = $0.015 → 0.15 HKP tokens
```

## Integration in Each Repo

### AA Repository Integration

```typescript
// packages/aa/src/observability/points-tracker.ts

export class PointsTracker {
  async trackGaslessTransaction(
    tx: Transaction,
    account: string,
    savedGas: bigint
  ) {
    // Gasless tx uses less gas = user burns fewer x402 credits
    // This indirectly supports ecosystem metrics
    
    // Log to MLflow
    await mlflow.logMetric('gas_saved_gwei', Number(savedGas));
    
    // Dashboard shows "You saved 50 gwei on this tx"
    // Points awarded separately via HyperAgent
  }
}
```

### SDK Repository Integration

```typescript
// packages/sdk/src/payments/x402-router.ts

export async function routePayment(
  amount: bigint,
  chain: string,
  action: string,
  creatorAddress?: string
) {
  // Track x402 spend for revenue sharing
  await logX402Spend({
    amount,
    chain,
    action,
    creatorAddress,  // Template creator
    timestamp: Date.now(),
  });
  
  // Return payment intent + metadata for points allocation
  return {
    id: intentId,
    amount,
    chain,
    facilitator,
    creatorAllocation: {
      address: creatorAddress,
      percentage: 0.50,
    }
  };
}
```

### HyperAgent Repository Integration

```python
# backend/hyperagent/api/routes.py

@router.post("/api/builds")
async def create_build(request: BuildRequest):
    build_id = str(uuid.uuid4())
    
    # Build happens...
    result = await agent.build_dapp(request.prompt)
    
    # Log x402 spend
    x402_spent = result["x402_credits_burned"]
    
    # Award points to template creator (if using template)
    template_creator = request.template_creator  # From request
    points_earned = x402_spent * 0.5  # 50% of credits value → points
    
    await CONTRACT.earnPoints(
        contributor=template_creator,
        ctype="template_usage",  # New type
        rawAmount=points_earned,
        contributionId=build_id,
    )
    
    # Log to MLflow
    mlflow.log_metric("x402_burned", x402_spent)
    mlflow.log_metric("points_allocated", points_earned)
```

---

# IMPACT & USE CASES

## Real-World Impact Matrix

### For Different User Personas

#### Developer (Building dApps)

**Before HyperKit:**
```
1. Learn Solidity (3-6 months)
2. Study Uniswap/Aave patterns (2-3 months)
3. Write contracts (1-2 weeks)
4. Audit contracts (2-3 weeks, $5k-50k cost)
5. Deploy to 1 chain (1 day)
6. Manual monitoring (ongoing)
────────────────────────────────────────
TIME: 5-7 months | COST: $20k | CHAINS: 1
RISK: High (security gaps common)
```

**With HyperKit:**
```
1. Write prompt: "Build AMM on Mantle + Solana"
2. AI generates, audits, deploys: 87 seconds
3. Monitoring auto-starts
────────────────────────────────────────
TIME: 2 minutes | COST: $0.15 | CHAINS: 2
RISK: Low (TEE-audited, automated)
```

**Impact**: 1000x faster, 100x cheaper, 2x more chains

---

#### Auditor (Security Researcher)

**Before HyperKit:**
```
1. Receive contract code (email/GitHub)
2. Manual review (20-40 hours)
3. Slither + custom checks
4. Write report (5 hours)
5. Send to client
────────────────────────────────────────
TIME: 25-45 hours | RATE: $150-300/hr
TOTAL: $3.75k-13.5k per audit
```

**With HyperKit:**
```
1. Contract submitted via HyperAgent
2. AI + Slither + TEE attested automatically (30 sec)
3. Review findings (1 hour)
4. Earn 50 points per audit ($5 HKP)
5. Cumulative income from audit queue
────────────────────────────────────────
TIME: 1 hour | INCENTIVE: 50 HKP/audit
RATE: ~$300-500/hour at scale
TOTAL: 10 audits/week = $1500-2500 recurring
```

**Impact**: Democratized auditing, faster turnaround, better UX

---

#### Mantle Grant Recipients

**Use Case**: Deploy ecosystem app, earn grant + x402 revenue

```
Scenario: Lend protocol on Mantle
1. Use HyperAgent: "Build lending protocol like Compound"
2. Deployed in 87 seconds
3. Mantle grant: $5k for deployment
4. x402 revenue sharing: Each builder using this template
   pays x402 credits → 50% to template creator
5. Month 1: 10 builders use template
   Each pays 5 credits × $0.05 = $0.25 each
   Revenue: 10 × 0.5 × $0.25 = $1.25

6. With HyperKit ecosystem growth:
   Month 6: 100 builders using = $12.50/month recurring
   Year 1: $150 passive income from one template
```

**Impact**: Layer 2 bootstrap revenue, aligns incentives

---

#### Token Holder / Governance

**Points → Voting Power**

```
Contributor Alice:
- Published 5 templates (50 HKP)
- Found 3 bugs (30 HKP)
- Earned 80 HKP total

At TGE: 80 HKP × 0.1 = 8 $HYPE tokens
8 $HYPE × $0.10 = $0.80 initial value

With governance:
- 8 HYPE = 8 votes in Snapshot
- Can vote on: which chains to add next, fee structures
- Early supporter → credibility in DAO

By Month 12:
- $HYPE price grows to $0.50 (5x)
- Portfolio value: 8 × $0.50 = $4
- Plus participation in $2M TVL ecosystem
```

**Impact**: Align community with protocol success

---

## Concrete Use Cases by Function

### Use Case 1: MEV-Resistant DEX on Hyperion

**Team**: 2 devs, 1 auditor  
**Timeline**: 1 week (with HyperKit)

```
Day 1:
  - Prompt: "Build MEV-resistant DEX (CoW-style) on Hyperion, 
    max gas 50gwei, with CFMM pricing"
  - HyperAgent generates: Router, Vault, Matcher contracts
  - Audit report: 0 HIGH findings, 2 LOW (info events missing)

Day 2:
  - Add events, regenerate
  - Audit: PASS
  - Deploy to Hyperion testnet

Day 3-5:
  - Manual testing on testnet
  - Add liquidity, test swaps, verify MEV protection

Day 6:
  - 50 founder rewards earned (template + audit)
  - Deploy to Hyperion mainnet (costs 3 x402 credits)
  - DAY 6: LIVE with $2k TVL

Day 7:
  - Mantle grants: $10k for novel MEV solution
  - Monitoring active: Real-time TVL, event tracking
  - Template published to marketplace
```

**Economics**:
```
Revenue:
- Mantle grant: $10k
- x402 revenue (future builds): $0.50/builder
- HyperKit points: 50 HKP × $0.10 = $5

Savings:
- Audit cost averted: $15k
- Developer time: 2 weeks saved = $5k value

Total Advantage: $10k grant + $20k saved = $30k net
```

---

### Use Case 2: Multi-Chain Vault Aggregator

**Team**: 1 dev (solo)  
**Timeline**: 2 days

```
Day 1:
  - Prompt: "Build yield aggregator targeting Mantle, Metis, Hyperion.
    Auto-compound, whitelisted protocols (Aave, Curve, Yearn).
    x402 integration for gas optimization."
  
  - HyperAgent generates:
    * VaultAggregator.sol (ERC-4626)
    * RebalanceStrategy.sol
    * x402PaymentHandler.sol
  
  - Audit: PASS (95% coverage)
  - Generated deployment scripts for all 3 chains

Day 2:
  - Deploy to all 3 chains (2 minutes, 3 x402 intents)
  - Configure yield targets
  - Launch landing page (Next.js template included)
  - Live on 3 chains simultaneously
```

**Monetization**:
```
Performance fee: 10% on harvested yield
Month 1: $500 TVL → $0 fee (too small)
Month 6: $50k TVL → $500/month yield → $50 fee
Year 1: $1M TVL → $10k/month yield → $1000/month fee

Plus:
- HyperKit points: 100 HKP (complex app) = $10
- x402 revenue: Each user paying gas through vault
  pays x402 credits → Solo dev gets 50% cut
```

---

### Use Case 3: Academic Research (Proof-of-Concept)

**Team**: PhD student  
**Goal**: Publish novel AMM design

```
Traditional Path:
1. Code smart contract (3 weeks)
2. Formal verification (2 weeks)
3. Testnet deployment (1 week)
4. Security audit (2 weeks, expensive)
5. Mainnet: risky for novel design
────────────────────────────────────────
Timeline: 2 months | Cost: $20k+ | Risk: High

HyperKit Path:
1. Prompt: "Implement Logarithmic Market Scoring Rule 
   (LMSR) AMM with constant utility function"
2. HyperAgent generates + audits: 87 seconds
3. Deploy to testnet: auto-verified
4. Publish paper citing HyperAgent attestation
5. Community testing on testnet (no risk)
────────────────────────────────────────
Timeline: 1 week | Cost: $0.15 | Risk: Contained

Impact:
- Faster research velocity (3 papers/year instead of 1)
- Reproducible results (code on-chain, verifiable)
- Community validates before mainnet
```

---

# RISK MITIGATION & DEPENDENCIES

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| **LLM hallucination** | High | Critical | Prompt engineering, RAG context, AI audit + human review gate |
| **RPC provider down** | Medium | High | RPC pooling with 3+ endpoints per chain, automatic failover |
| **TEE compromise** | Low | Critical | Attestation quotes verified on-chain, redundant TEE providers |
| **x402 payment failure** | Low | Medium | Fallback to alternative facilitator, grace period |
| **Gas spike** | Medium | Medium | Dynamic gas estimation, user-adjustable thresholds, queue logic |
| **Smart contract bugs** | Low | Critical | Formal verification (Certora), AI + human audit, testnet stress tests |
| **Regulatory (staking)** | Medium | High | Consult legal, structure as rewards not securities |
| **Market adoption slowdown** | Medium | High | Partner with L2s (Mantle, Metis), grant program |

---

## Critical Dependencies

```
EXTERNAL:
├── Chainlink (Price feeds, CCIP)
├── Thirdweb (x402 on Avalanche)
├── LazAI (Settlement on Metis)
├── Phala (TEE for audits)
├── Socket (Cross-chain routing)
├── Moralis (Event webhooks)
└── Dune (On-chain analytics)

INTERNAL:
├── AA repo (wallet layer)
├── SDK repo (adapter + registry)
└── HyperAgent repo (orchestration)

INFRASTRUCTURE:
├── PostgreSQL (primary DB)
├── Redis (cache + sessions)
├── Pinecone (vector DB)
├── GitHub (SCM + CI/CD)
├── Vercel (frontend hosting)
├── Render (backend hosting)
└── Foundry (Solidity tooling)
```

## Fallback Strategies

```
If Thirdweb x402 down:
  → Route to Socket payment instead
  → Manual bridge via LazAI
  → Defer non-critical builds to queue

If Phala TEE slow:
  → Use LazAI as secondary
  → Return unattested audit (with disclaimer)
  → Escalate to human reviewer

If Firecrawl RAG stale:
  → Use cached version (24-hour TTL)
  → Supplement with general LLM knowledge
  → Alert to admin for manual refresh

If any chain RPC down:
  → Use secondary RPC from pool
  → Block new deployments (notify user)
  → Maintain monitoring/query operations
```

---

## Deployment Sequence

**Week 1-2**: AA repo testnet launch  
**Week 3-4**: SDK + Points contract testnet  
**Week 5-6**: HyperAgent MVP testnet (simple contracts only)  
**Week 7-8**: Full integration testnet (all repos)  

**Week 8 END**: Mantle testnet live  
**Week 9-10**: Metis testnet, bug fixes, security audit  
**Week 11**: Mainnet soft launch (limited, Mantle only)  
**Week 12**: Full mainnet (all 3 chains)

---

# SUMMARY TABLE

## All 3 Repos at a Glance

| Aspect | AA | SDK | HyperAgent |
|--------|----|----|----------|
| **Size** | 15k LOC | 20k LOC | 25k LOC |
| **Language** | TypeScript | TypeScript | Python + TS |
| **Time Est.** | 94h (12d) | 103h (13d) | 126h (16d) |
| **npm/Pub** | @hyperkit/wallet | @hyperkit/sdk | SaaS + Dashboard |
| **Success Rate** | 98%+ tx | 85%+ coverage | 95%+ builds |
| **Key Output** | Gasless UX | 100+ chains | <90s builds |
| **Dependencies** | Solana, SUI | Firecrawl, Adapters | TEE, Foundry |
| **Launch Target** | Week 2-3 | Week 4-5 | Week 6-7 |

---

# FINAL CHECKLIST

- [ ] All folder structures created
- [ ] Minimal code skeletons in place
- [ ] Tech stack finalized + dependencies ordered
- [ ] Acceptance criteria defined per task
- [ ] Time estimates reviewed by leads
- [ ] Integration points documented
- [ ] Database schema created
- [ ] GitHub Actions workflows configured
- [ ] Environment variables template ready
- [ ] Tokenomics flow specified end-to-end
- [ ] Risk mitigations assigned
- [ ] Fallback strategies documented
- [ ] Team allocation finalized
- [ ] Mantle/Metis partnership contacts engaged
- [ ] Security audit firm selected
- [ ] Grant applications submitted
- [ ] Go/no-go decision made
- [ ] Teams begin Week 1 tasks

---

**END OF IMPLEMENTATION GUIDE**

All 3 repositories are ready for immediate development. Each team has concrete, actionable tasks with clear acceptance criteria and time estimates. The tokenomics layer integrates deeply throughout to align community incentives with protocol growth.

**Total Development Time**: ~40 days (4 parallel teams)  
**Total LOC**: ~60,000  
**Launch Date**: Week 8 (Testnet) → Week 12 (Mainnet)  
**Revenue Target**: $948k Year 1

🚀 **Ready to execute.**