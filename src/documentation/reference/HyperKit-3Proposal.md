# HyperKit: 3 Repository Implementation Proposals
## Network-Agnostic Web3 AI-Native DeFi Platform

**Master Vision**: One prompt → Full audited, deployed dApp across 100+ chains  
**Development Model**: Three parallel, modular repositories with unified goals

---

## OVERVIEW: REPOSITORY STRUCTURE

```
Hyperkit-Labs/
├── aa (Account Abstraction Module)
│   ├── ERC-4337 + EIP-7702 bundlers
│   ├── Multi-chain wallet abstraction
│   ├── Session keys + gasless UX
│   └── FOCUS: Wallet layer interop
│
├── sdk (Core SDK & Integration Layer)
│   ├── @hyperkit/sdk package
│   ├── Contract wrappers + RPC pooling
│   ├── Chain adapters (EVM, Solana, SUI)
│   ├── x402 payment routing
│   └── FOCUS: Developer experience + multichain
│
└── hyperagent (AI Orchestrator & Lifecycle)
    ├── ROMA-powered agent (DSPy)
    ├── Firecrawl RAG pipeline
    ├── Contract generation + auditing
    ├── TEE integration (LazAI + EigenCompute)
    └── FOCUS: Agent intelligence + automation
```

**Key Principle**: Each repo is independently deployable but collectively forms HyperKit. Repos communicate via:
- Published npm packages (`@hyperkit/sdk`, `@hyperkit/wallet`)
- Shared Solidity contract libraries (CyberContracts)
- Common data formats (x402 intents, audit reports)
- Unified observability (MLflow, Dune)

---

# PROPOSAL 1: AA REPOSITORY
## Account Abstraction & Smart Wallet Infrastructure

### Repository: `Hyperkit-Labs/aa`

**Purpose**: Build network-agnostic, gasless smart wallet infrastructure that works seamlessly across EVM, Solana, and SUI.

**Scope**: Everything wallet + account abstraction  
**Dependencies**: Uses `@hyperkit/sdk` for chain adapters  
**Exports to**: `@hyperkit/wallet` npm package

---

## DELIVERABLES (8 Weeks)

### WEEK 1-2: ERC-4337 V0.7 + EIP-7702 Foundation

#### Task AA-1: EntryPoint V0.7 Integration
```typescript
// src/evm/entrypoint.ts
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

**Acceptance Criteria**:
- [ ] EntryPoint v0.7 integration on Mantle + Metis + Hyperion testnets
- [ ] SimpleAccount factory works with arbitrary owners
- [ ] Gas estimation accurate within 10%
- [ ] Bundler integration with Alchemy (free tier)

**Estimate**: 8h

#### Task AA-2: EIP-7702 Stateless Account Support
```typescript
// src/evm/eip7702.ts
export class EIP7702Account {
  // EIP-7702: delegation system
  constructor(private owner: Address, private implementation: Address) {}

  async createDelegationTx() {
    return {
      type: 0x07,  // EIP-7702 tx type
      authorization: [{
        chainId: 1,
        nonce: 0,
        r: "0x...",
        s: "0x...",
        yParity: 0
      }],
      to: this.implementation,
      data: "0x...",
      value: "0"
    };
  }

  // Auto-execution via delegation
  async execute(target: string, data: string) {
    const tx = await this.createDelegationTx();
    return tx;  // No pre-execution storage needed
  }
}
```

**Acceptance Criteria**:
- [ ] EIP-7702 tx type (0x07) encoding
- [ ] Delegation bytecode generation
- [ ] Fallback to ERC-4337 if chain unsupported
- [ ] Tested on Base + Optimism

**Estimate**: 6h

### WEEK 2-3: Multi-Chain Abstraction (Solana + SUI)

#### Task AA-3: Solana Phantom Integration
```typescript
// src/solana/phantom.ts
import { PhantomProvider } from "@phantom/phantom-service-worker-api";

export class SolanaWallet {
  private provider: PhantomProvider;

  constructor() {
    this.provider = window.phantom?.solana;
  }

  async connect() {
    const response = await this.provider.connect();
    return response.publicKey.toString();
  }

  async sendTransaction(tx: Transaction) {
    // Phantom handles signing + submission
    const signature = await this.provider.signAndSendTransaction(tx);
    return signature;
  }

  // Session keys for agent automation
  async createSessionKey(
    agentPubkey: PublicKey,
    permissions: { program: PublicKey; maxAmount: u64 }[]
  ) {
    // Uses Phantom's session token feature
    return await this.provider.signMessage(
      Buffer.from(JSON.stringify({ agentPubkey, permissions }))
    );
  }
}
```

**Acceptance Criteria**:
- [ ] Phantom wallet detection + connection
- [ ] Transaction signing + submission
- [ ] Session keys for agent automation
- [ ] Error handling for user rejection

**Estimate**: 6h

#### Task AA-4: SUI Move Integration
```typescript
// src/sui/sui-wallet.ts
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

  // Session key pattern for SUI
  async createCapability(agent: string) {
    // SUI's object-centric design: mint a capability object
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

**Acceptance Criteria**:
- [ ] Move module execution (simple swap/transfer)
- [ ] Capability-based auth for agents
- [ ] Gas estimation + dynamic networks
- [ ] Tested on SUI Testnet

**Estimate**: 8h

### WEEK 3-4: Session Keys & Gasless UX

#### Task AA-5: Session Key Infrastructure
```typescript
// src/common/session-keys.ts
export interface SessionKey {
  agentAddress: string;
  permissions: Permission[];
  expiresAt: number;
  signature: string;  // Owner signature + hash
}

export class SessionKeyManager {
  // Create a session key that agent can use gaslessly
  async createSessionKey(
    agent: string,
    permissions: Permission[],
    ttl: number
  ): Promise<SessionKey> {
    const sessionKey: SessionKey = {
      agentAddress: agent,
      permissions,
      expiresAt: Date.now() + ttl,
      signature: ""
    };

    // Sign with owner key
    const hash = keccak256(
      ethers.defaultAbiCoder.encode(
        ["address", "tuple[]", "uint256"],
        [agent, permissions, sessionKey.expiresAt]
      )
    );

    sessionKey.signature = await this.owner.signMessage(hash);
    return sessionKey;
  }

  // Verify session key is valid
  async validateSessionKey(key: SessionKey) {
    const recovered = ethers.recoverAddress(
      keccak256(ethers.defaultAbiCoder.encode(
        ["address", "tuple[]", "uint256"],
        [key.agentAddress, key.permissions, key.expiresAt]
      )),
      key.signature
    );

    return recovered === this.owner && key.expiresAt > Date.now();
  }
}
```

**Smart Contract (ERC-4337)**:
```solidity
// contracts/SessionKeyValidator.sol
pragma solidity ^0.8.0;

contract SessionKeyValidator is BaseAuthorizationModule {
  mapping(address => mapping(bytes32 => SessionKey)) public sessionKeys;

  struct SessionKey {
    address agent;
    uint256 expiresAt;
    bytes permissions;  // Encoded (target, selector, limits)
    bool revoked;
  }

  function validateUserOp(
    UserOperation calldata userOp,
    bytes32 userOpHash,
    bytes calldata sessionKeyData
  ) external view returns (uint256) {
    // Decode session key from userOp.signature
    (address agent, bytes32 keyId, bytes memory sig) = abi.decode(
      sessionKeyData,
      (address, bytes32, bytes)
    );

    SessionKey memory key = sessionKeys[msg.sender][keyId];
    
    require(!key.revoked && key.expiresAt > block.timestamp, "Invalid session");
    require(_verifyPermission(userOp, key.permissions), "Disallowed operation");

    // Verify agent signed this userOp (optional: require co-signature)
    bytes32 digest = toEthSignedMessageHash(userOpHash);
    require(ecrecover(digest, ...) == agent, "Invalid signature");

    return 0;  // Valid
  }
}
```

**Acceptance Criteria**:
- [ ] Session key creation + validation
- [ ] Smart contract permissions encoding
- [ ] Agent can execute userOps without owner signature
- [ ] TTL enforcement + revocation

**Estimate**: 10h

#### Task AA-6: Paymaster Integration (Sponsorship)
```typescript
// src/evm/paymaster-client.ts
export class HyperPaymaster {
  constructor(
    private rpc: string,
    private paymasterAddress: string,
    private paymasterApiKey?: string
  ) {}

  async sponsorUserOp(userOp: UserOperation): Promise<string> {
    // Call paymaster_generateAndSignPaymasterAndData RPC
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

  // Smart account calls paymaster for gas sponsorship
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

**Acceptance Criteria**:
- [ ] Alchemy paymaster integration (free tier)
- [ ] Sponsorship request + response flow
- [ ] Gas limit estimation accurate
- [ ] Works with ERC-4337 bundler

**Estimate**: 6h

### WEEK 4-5: React Hooks & UI Components

#### Task AA-7: React Hooks Package
```bash
npm i @hyperkit/wallet @hyperkit/sdk
```

```typescript
// src/react/useHyperWallet.ts
export function useHyperWallet(chain: SupportedChain = "mantle") {
  const [account, setAccount] = useState<string | null>(null);
  const [wallet, setWallet] = useState<HyperWallet | null>(null);
  const [gasless, setGasless] = useState(true);

  const connect = async () => {
    const w = new HyperWallet({
      chains: [chain],
      accountType: "ERC-4337"
    });
    await w.connect();
    setWallet(w);
    setAccount(await w.getAddress());
  };

  const sendTransaction = async (
    to: string,
    data: string,
    value: bigint = 0n
  ) => {
    if (!wallet) throw new Error("Wallet not connected");
    return await wallet.sendTransaction({
      to,
      data,
      value,
      gasless
    });
  };

  const createSessionKey = async (agent: string, ttl: number) => {
    if (!wallet) throw new Error("Wallet not connected");
    return await wallet.createSessionKey(agent, ttl);
  };

  return {
    account,
    wallet,
    connect,
    disconnect: () => setWallet(null),
    sendTransaction,
    createSessionKey,
    isGaslessEnabled: gasless,
    setGasless
  };
}

// Usage
export function App() {
  const { account, connect, sendTransaction } = useHyperWallet("mantle");

  return (
    <button onClick={connect}>
      {account ? `Connected: ${account.slice(0, 6)}...` : "Connect Wallet"}
    </button>
  );
}
```

**Acceptance Criteria**:
- [ ] `useHyperWallet` hook functional
- [ ] `useBalance`, `useAllowance` hooks
- [ ] Auto-reconnect on page reload
- [ ] Network switching support

**Estimate**: 8h

#### Task AA-8: UI Components (shadcn Integration)
```typescript
// src/components/WalletConnect.tsx
import { Button } from "@/components/ui/button";
import { useHyperWallet } from "@/hooks/useHyperWallet";

export function WalletConnect() {
  const { account, connect, disconnect } = useHyperWallet();

  if (account) {
    return (
      <div className="flex items-center gap-2">
        <span>{account.slice(0, 6)}...{account.slice(-4)}</span>
        <Button onClick={disconnect} variant="outline">Disconnect</Button>
      </div>
    );
  }

  return (
    <Button onClick={connect} variant="default">
      Connect Wallet
    </Button>
  );
}

// GaslessToggle component
export function GaslessToggle() {
  const { gasless, setGasless } = useHyperWallet();

  return (
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={gasless}
        onChange={(e) => setGasless(e.target.checked)}
      />
      <span>Gasless Transactions</span>
    </label>
  );
}
```

**Acceptance Criteria**:
- [ ] WalletConnect component renders
- [ ] GaslessToggle functional
- [ ] SessionKeyManager UI
- [ ] Mobile responsive

**Estimate**: 6h

### WEEK 5-6: Testing & Hardening

#### Task AA-9: Integration Tests
```typescript
// test/erc4337.test.ts
describe("ERC-4337 Integration", () => {
  let factory: HyperWalletFactory;
  let account: string;

  beforeEach(async () => {
    factory = new HyperWalletFactory(MANTLE_RPC, MANTLE_CHAIN_ID);
    account = await factory.createAccount(OWNER_ADDRESS);
  });

  it("should send userOp via bundler", async () => {
    const userOp = {
      sender: account,
      // ... filled userOp
    };

    const opHash = await factory.sendUserOperation(userOp);
    expect(opHash).toMatch(/^0x/);
  });

  it("should sponsor gas via paymaster", async () => {
    const tx = await factory.sendGaslessTransaction(
      account,
      DAI_ADDRESS,
      encodeTransfer(RECIPIENT, parseEther("1"))
    );

    expect(tx.hash).toBeDefined();
  });

  it("should validate session key", async () => {
    const sessionKey = await factory.createSessionKey(AGENT_ADDRESS, 3600);
    const valid = await factory.validateSessionKey(sessionKey);
    expect(valid).toBe(true);
  });
});

// test/solana.test.ts
describe("Solana Phantom Integration", () => {
  it("should connect to Phantom", async () => {
    const wallet = new SolanaWallet();
    const pubkey = await wallet.connect();
    expect(pubkey).toMatch(/^[1-9A-HJ-NP-Z]+$/);  // Base58
  });

  it("should create session key", async () => {
    const wallet = new SolanaWallet();
    const sessionKey = await wallet.createSessionKey(AGENT_PUBKEY, []);
    expect(sessionKey).toBeDefined();
  });
});
```

**Acceptance Criteria**:
- [ ] 80%+ coverage (wallets, bundlers, paymasters)
- [ ] All 3 chains tested (EVM, Solana, SUI)
- [ ] Gas estimation within 10% of actual
- [ ] Session key flow end-to-end

**Estimate**: 8h

#### Task AA-10: Production Security Hardening
```typescript
// src/security/index.ts
export class SecurityManager {
  // Rate limiting per agent
  private agentRateLimits = new Map<string, RateLimit>();

  async validateTransaction(tx: Transaction, agent: string) {
    // 1. Check rate limit
    const limit = this.agentRateLimits.get(agent) || { calls: 0, reset: 0 };
    if (limit.calls > 100) {
      throw new Error("Rate limit exceeded");
    }

    // 2. Check gas price bounds
    const maxGasPrice = ethers.parseUnits("200", "gwei");
    if (tx.gasPrice > maxGasPrice) {
      throw new Error("Gas price too high");
    }

    // 3. Check value bounds (session key limits)
    const maxValue = parseEther("1");  // Per-key limit
    if (tx.value > maxValue) {
      throw new Error("Value exceeds session key limit");
    }

    // 4. Check function whitelist (if session key)
    const selector = tx.data.slice(0, 10);
    if (!WHITELISTED_SELECTORS.includes(selector)) {
      throw new Error("Function not whitelisted");
    }

    return true;
  }
}

// Encrypted storage for keys
export class SecureKeyStore {
  async storePrivateKey(key: string, password: string) {
    const encrypted = await encryptAES256(key, password);
    localStorage.setItem("private_key_encrypted", encrypted);
  }

  async retrievePrivateKey(password: string): Promise<string> {
    const encrypted = localStorage.getItem("private_key_encrypted");
    if (!encrypted) throw new Error("No key found");
    return await decryptAES256(encrypted, password);
  }
}
```

**Acceptance Criteria**:
- [ ] Rate limiting functional
- [ ] Key encryption working
- [ ] No hardcoded secrets
- [ ] Security audit checklist passed

**Estimate**: 6h

### WEEK 6-7: Observability & Monitoring

#### Task AA-11: MLflow Tracing
```typescript
// src/observability/index.ts
import MLflow from "mlflow";

export class WalletObservability {
  private mlflow = new MLflow({
    trackingUri: MLFLOW_URI
  });

  async trackTransaction(
    userOpHash: string,
    sender: string,
    target: string,
    gasUsed: bigint,
    success: boolean
  ) {
    const run = this.mlflow.startRun();

    this.mlflow.logParam("chain", "mantle");
    this.mlflow.logParam("account_type", "ERC-4337");
    this.mlflow.logMetric("gas_used", Number(gasUsed));
    this.mlflow.logMetric("latency_ms", Date.now() - startTime);
    this.mlflow.logMetric("success", success ? 1 : 0);

    // Log userOp as artifact
    this.mlflow.logArtifact(
      JSON.stringify({ userOpHash, sender, target }),
      "userop.json"
    );

    run.endRun();
  }
}
```

**Acceptance Criteria**:
- [ ] All transactions logged to MLflow
- [ ] Gas metrics tracked per chain
- [ ] Error rates monitored
- [ ] Dashboard queryable

**Estimate**: 4h

#### Task AA-12: Documentation & Launch
- [ ] API documentation (TypeDoc)
- [ ] Integration guide (npm install, usage)
- [ ] Example dApps (React + Next.js)
- [ ] Security best practices
- [ ] Gas optimization tips

**Estimate**: 8h

---

## AA REPOSITORY: SUCCESS METRICS

| Metric | Target | Threshold |
|--------|--------|-----------|
| **Code Coverage** | 85%+ | Must pass |
| **Supported Chains** | EVM, Solana, SUI | All 3 |
| **Gas Overhead** | <30% above raw tx | Measured |
| **Paymaster Sponsorship Rate** | 95%+ | >90% |
| **Transaction Success Rate** | 98%+ | >95% |
| **API Response Time** | <500ms | p99 |
| **npm Package Downloads** | 500+/month (M2) | Growth tracked |

---

# PROPOSAL 2: SDK REPOSITORY
## Multi-Chain Abstraction & Developer Experience

### Repository: `Hyperkit-Labs/sdk`

**Purpose**: Provide the core developer toolkit for building apps on 100+ chains without chain-specific code.

**Scope**: Chain adapters, RPC pooling, contract ABIs, payment routing  
**Dependencies**: Uses `/aa` for wallet integration  
**Exports to**: `@hyperkit/sdk` npm package

---

## DELIVERABLES (8 Weeks)

### WEEK 1: Network Registry & Capability Router

#### Task SDK-1: Network Registry (Runtime Config)
```typescript
// src/registry/network-registry.ts
export interface NetworkConfig {
  chainId: number;
  name: string;
  rpc: string[];  // Multiple RPC endpoints for failover
  blockExplorers: { name: string; url: string }[];
  
  // Capabilities per network
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
}

export const NETWORK_REGISTRY: Record<string, NetworkConfig> = {
  // EVM Chains
  mantle: {
    chainId: 5000,
    name: "Mantle",
    rpc: ["https://rpc.mantle.xyz", "https://mantle-rpc.mantle.xyz"],
    blockExplorers: [{ name: "Explorer", url: "https://explorer.mantle.xyz" }],
    account: { type: "ERC-4337", entryPoint: "0x...", accountFactory: "0x..." },
    payment: { facilitator: "thirdweb_x402", metering: true, creditsPerRun: 3 },
    da: { provider: "Mantle" }
  },

  metis: {
    chainId: 1088,
    name: "Metis",
    rpc: ["https://metis-mainnet.public.blastapi.io"],
    account: { type: "ERC-4337" },
    payment: { facilitator: "lazai", metering: true, creditsPerRun: 2 },
    da: { provider: "EigenDA" }
  },

  hyperion: {
    chainId: 728,
    name: "Hyperion",
    rpc: ["https://hyperion-rpc.metis.io"],
    account: { type: "ERC-4337" },
    payment: { facilitator: "lazai", metering: true, creditsPerRun: 2 },
    da: { provider: "Mantle" }
  },

  // Non-EVM
  solana: {
    chainId: 101,  // Solana mainnet
    name: "Solana",
    rpc: ["https://api.mainnet-beta.solana.com"],
    account: { type: "Phantom" },
    payment: { facilitator: "direct", metering: true, creditsPerRun: 1 },
    da: { provider: "Walrus" }
  },

  sui: {
    chainId: 99,  // SUI uses 99 for compatibility
    name: "Sui",
    rpc: ["https://fullnode.mainnet.sui.io:443"],
    account: { type: "SUI" },
    payment: { facilitator: "socket", metering: true, creditsPerRun: 2 },
    da: { provider: "Walrus" }
  }

  // ... 95+ more chains with consistent config
};

export class NetworkRegistry {
  getConfig(chain: string): NetworkConfig {
    const config = NETWORK_REGISTRY[chain.toLowerCase()];
    if (!config) throw new Error(`Unsupported chain: ${chain}`);
    return config;
  }

  getRPC(chain: string): string[] {
    return this.getConfig(chain).rpc;
  }

  getCapability(chain: string, type: "account" | "payment" | "da") {
    return this.getConfig(chain)[type];
  }

  // Add runtime chains (for new networks)
  addRuntime(chain: string, config: NetworkConfig) {
    NETWORK_REGISTRY[chain] = config;
  }
}
```

**Acceptance Criteria**:
- [ ] Registry supports 100+ chains (50 EVM, 10 Solana variants, 10 Cosmos, 30 others)
- [ ] No code changes needed to add new chain
- [ ] RPC failover tested
- [ ] Lazy-loaded network configs

**Estimate**: 10h

#### Task SDK-2: Capability Router
```typescript
// src/router/capability-router.ts
export class CapabilityRouter {
  constructor(private registry: NetworkRegistry) {}

  async route(
    action: "deploy" | "call" | "send" | "bridge",
    chain: string,
    options?: RoutingOptions
  ): Promise<Adapter> {
    const config = this.registry.getConfig(chain);

    // Map action to required capability
    const required = this.getRequiredCapability(action);
    const capability = config[required];

    // Get appropriate adapter
    if (chain === "solana") {
      return new SolanaAdapter(this.registry.getRPC(chain));
    } else if (chain === "sui") {
      return new SuiAdapter(this.registry.getRPC(chain));
    } else {
      // EVM chains use same adapter, different config
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
      deploy: "da",      // Needs data availability
      call: "account",   // Needs smart account
      send: "account",   // Needs account
      bridge: "payment"  // Needs x402 metering
    };
    return map[action] || "account";
  }
}
```

**Acceptance Criteria**:
- [ ] Router returns correct adapter per chain/action
- [ ] Adapter interface universal
- [ ] Fallback logic functional
- [ ] Zero hardcoded chain checks

**Estimate**: 8h

### WEEK 2-3: Chain Adapters

#### Task SDK-3: EVM Adapter (Foundational)
```typescript
// src/adapters/evm-adapter.ts
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

  async getBlockNumber(): Promise<number> {
    return await this.provider.getBlockNumber();
  }

  async waitForTransaction(txHash: string, confirmations: number = 1) {
    return await this.provider.waitForTransaction(txHash, confirmations);
  }
}
```

**Acceptance Criteria**:
- [ ] Deploy, call, gas estimation working
- [ ] Tested on Mantle, Metis, Hyperion
- [ ] Error handling (RPC down, tx reverted)
- [ ] Gas estimation accurate within 10%

**Estimate**: 10h

#### Task SDK-4: Solana Adapter
```typescript
// src/adapters/solana-adapter.ts
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction
} from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";

export class SolanaAdapter implements IChainAdapter {
  private connection: Connection;
  private program: Program;

  constructor(rpc: string, private walletKeypair: Keypair) {
    this.connection = new Connection(rpc, "confirmed");
  }

  async deploy(bytecode: string, abi: any[], constructorArgs: any[]) {
    // Solana uses Anchor IDL + PDAs for state
    // bytecode is Anchor program binary
    const programKeypair = Keypair.generate();
    
    // Use Anchor CLI in background or deploy via BPF loader
    const deployTx = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: this.walletKeypair.publicKey,
        newAccountPubkey: programKeypair.publicKey,
        space: bytecode.length,
        lamports: await this.connection.getMinimumBalanceForRentExemption(
          bytecode.length
        ),
        programId: BPF_LOADER_UPGRADEABLE_PROGRAM_ID
      })
    );

    const signature = await sendAndConfirmTransaction(
      this.connection,
      deployTx,
      [this.walletKeypair, programKeypair]
    );

    return {
      address: programKeypair.publicKey.toString(),
      txHash: signature
    };
  }

  async call(address: string, method: string, args: any[]): Promise<any> {
    const programId = new PublicKey(address);
    const tx = new Transaction().add(
      new TransactionInstruction({
        programId,
        keys: [],
        data: Buffer.from(JSON.stringify({ method, args }))
      })
    );

    return await sendAndConfirmTransaction(this.connection, tx, [
      this.walletKeypair
    ]);
  }

  async estimateGas(method: string, args: any[]): Promise<bigint> {
    // Solana doesn't have gas, but compute units
    // Estimate based on method + args size
    const estimatedComputeUnits = 200000 + (args.length * 10000);
    return BigInt(estimatedComputeUnits);
  }

  async getBalance(address: string): Promise<bigint> {
    const lamports = await this.connection.getBalance(new PublicKey(address));
    return BigInt(lamports);
  }
}
```

**Acceptance Criteria**:
- [ ] Anchor program deployment
- [ ] PDA-based state management
- [ ] Compute unit estimation
- [ ] Tested on Solana devnet

**Estimate**: 12h

#### Task SDK-5: SUI Adapter
```typescript
// src/adapters/sui-adapter.ts
import { SuiClient } from "@mysten/sui.js/client";
import { TransactionBlock, TransactionBlockInput } from "@mysten/sui.js/transactions";
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

    // SUI publish (Move bytecode)
    const [upgradeCap] = tx.publish({
      modules: [bytecode],
      dependencies: [SUI_FRAMEWORK_ID]
    });

    tx.transferObjects([upgradeCap], tx.pure(await this.signer.getAddress()));

    const result = await this.signer.signAndExecuteTransactionBlock({
      transactionBlock: tx
    });

    // Extract package ID from created objects
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
    // SUI dry run for gas estimation
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

**Acceptance Criteria**:
- [ ] Move package deployment
- [ ] moveCall functionality
- [ ] Dry-run gas estimation
- [ ] Tested on SUI testnet

**Estimate**: 10h

### WEEK 3-4: Contract Wrappers & RPC Pooling

#### Task SDK-6: Contract Wrapper Generation
```typescript
// src/codegen/contract-wrapper-generator.ts
export class ContractWrapperGenerator {
  generate(abi: any[], contractName: string) {
    const methods = abi.filter((item) => item.type === "function");

    let code = `
export class ${contractName} {
  constructor(private adapter: IChainAdapter, private address: string) {}

${methods.map((method) => this.generateMethod(method)).join("\n\n")}
}`;

    return code;
  }

  private generateMethod(method: any) {
    const params = method.inputs
      .map((input) => `${input.name}: ${this.solTypeToTs(input.type)}`)
      .join(", ");

    const returnType = this.solTypeToTs(
      method.outputs?.[0]?.type || "void"
    );

    return `
  async ${method.name}(${params}): Promise<${returnType}> {
    return await this.adapter.call(
      this.address,
      "${method.name}",
      [${method.inputs.map((i) => i.name).join(", ")}]
    );
  }
`;
  }

  private solTypeToTs(solidityType: string): string {
    const map = {
      "address": "string",
      "uint256": "bigint",
      "bool": "boolean",
      "bytes": "string",
      "string": "string"
    };
    return map[solidityType] || "any";
  }
}

// Usage
const generator = new ContractWrapperGenerator();
const uniswapCode = generator.generate(UNISWAP_V3_ABI, "UniswapV3");
fs.writeFileSync("src/contracts/UniswapV3.ts", uniswapCode);
```

**Pre-generated Contracts**:
```typescript
// src/contracts/index.ts (pre-built)
export { UniswapV2 } from "./uniswap-v2";
export { UniswapV3 } from "./uniswap-v3";
export { UniswapV4 } from "./uniswap-v4";
export { Aave } from "./aave";
export { Curve } from "./curve";
export { Yearn } from "./yearn";
export { Lido } from "./lido";
// ... 20+ more popular contracts
```

**Acceptance Criteria**:
- [ ] Code generation working
- [ ] 20+ pre-generated contracts included
- [ ] Type safety maintained
- [ ] Generated code compiles

**Estimate**: 8h

#### Task SDK-7: RPC Pool & Failover
```typescript
// src/rpc/rpc-pool.ts
export class RPCPool {
  private rpcEndpoints: string[];
  private health: Map<string, HealthStatus> = new Map();
  private activeIndex: number = 0;

  constructor(endpoints: string[]) {
    this.rpcEndpoints = endpoints;
    endpoints.forEach((ep) => {
      this.health.set(ep, { healthy: true, lastCheck: Date.now() });
    });

    // Health check every 30 seconds
    setInterval(() => this.healthCheck(), 30000);
  }

  async call<T>(method: string, params: any[]): Promise<T> {
    // Try healthy endpoints first
    const healthy = this.rpcEndpoints.filter(
      (ep) => this.health.get(ep)?.healthy
    );

    for (const endpoint of healthy) {
      try {
        return await this.callEndpoint(endpoint, method, params);
      } catch (e) {
        // Mark as unhealthy, try next
        this.health.get(endpoint)!.healthy = false;
      }
    }

    // All healthy endpoints failed, try unhealthy as fallback
    for (const endpoint of this.rpcEndpoints) {
      try {
        const result = await this.callEndpoint(endpoint, method, params);
        // Recovered, mark as healthy
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

**Acceptance Criteria**:
- [ ] Failover tested with endpoint down
- [ ] Health check runs correctly
- [ ] Recovery works when endpoint restored
- [ ] Latency tracking per endpoint

**Estimate**: 6h

### WEEK 4: x402 Payment Routing

#### Task SDK-8: x402 Multi-Network Routing
```typescript
// src/payments/x402-router.ts
export class X402Router {
  constructor(private registry: NetworkRegistry) {}

  async routePayment(
    amount: bigint,
    targetChain: string,
    action: "agent_run" | "deployment" | "audit"
  ): Promise<PaymentIntent> {
    const config = this.registry.getConfig(targetChain);

    let facilitator: string;
    switch (config.payment.facilitator) {
      case "thirdweb_x402":
        return await this.thirdwebX402(amount, targetChain, action);
      case "lazai":
        return await this.lazaiSettlement(amount, targetChain, action);
      case "socket":
        return await this.socketPayment(amount, targetChain, action);
      case "direct":
        return await this.directTransfer(amount, targetChain, action);
      default:
        throw new Error(`Unknown facilitator: ${facilitator}`);
    }
  }

  private async thirdwebX402(
    amount: bigint,
    chain: string,
    action: string
  ): Promise<PaymentIntent> {
    // Thirdweb x402 on Avalanche, Base, Optimism
    const x402 = new Thirdweb_x402({
      apiKey: process.env.THIRDWEB_API_KEY
    });

    const intent = await x402.createPaymentIntent({
      amount: amount.toString(),
      currency: "USDC",
      description: action,
      webhookUrl: `${WEBHOOK_URL}/x402/${chain}`
    });

    return {
      id: intent.id,
      amount,
      chain,
      facilitator: "thirdweb_x402",
      paymentUrl: intent.url,
      expiresAt: Date.now() + 3600000  // 1 hour
    };
  }

  private async lazaiSettlement(
    amount: bigint,
    chain: string,
    action: string
  ): Promise<PaymentIntent> {
    // LazAI on Metis / Hyperion
    const lazai = new LazAI({
      apiKey: process.env.LAZAI_API_KEY
    });

    const settlement = await lazai.createSettlement({
      amount: ethers.formatUnits(amount, 6),  // Assume USDC 6 decimals
      chain: chain === "metis" ? "metis_mainnet" : "hyperion",
      action
    });

    return {
      id: settlement.id,
      amount,
      chain,
      facilitator: "lazai",
      txHash: settlement.txHash,
      expiresAt: Date.now() + 7200000  // 2 hours
    };
  }

  private async socketPayment(
    amount: bigint,
    chain: string,
    action: string
  ): Promise<PaymentIntent> {
    // Socket for cross-chain intent settlement
    const socket = new Socket({
      apiKey: process.env.SOCKET_API_KEY
    });

    const quote = await socket.getQuote({
      amount,
      fromChain: "ethereum",
      toChain: chain,
      fromToken: "USDC",
      toToken: "USDC"
    });

    return {
      id: quote.routeId,
      amount: quote.outputAmount,
      chain,
      facilitator: "socket",
      route: quote.route,
      expiresAt: quote.expiresAt
    };
  }

  private async directTransfer(
    amount: bigint,
    chain: string,
    action: string
  ): Promise<PaymentIntent> {
    // Direct SPL transfer (Solana)
    const tx = new Transaction().add(
      createTransferInstruction(
        USDC_TOKEN_ACCOUNT,
        RECIPIENT_TOKEN_ACCOUNT,
        PAYER,
        amount
      )
    );

    return {
      id: "direct_" + Date.now(),
      amount,
      chain,
      facilitator: "direct",
      transaction: tx,
      expiresAt: Date.now() + 600000  // 10 minutes
    };
  }
}
```

**Acceptance Criteria**:
- [ ] All 4 facilitators implemented
- [ ] Payment intents created successfully
- [ ] Expiration handling
- [ ] Tested on each network

**Estimate**: 10h

### WEEK 5-6: SDK Core Package

#### Task SDK-9: Main SDK Export
```typescript
// src/index.ts
export class HyperKit {
  public registry: NetworkRegistry;
  public router: CapabilityRouter;
  public x402: X402Router;
  public rpcPool: RPCPool;

  constructor(config?: HyperKitConfig) {
    this.registry = new NetworkRegistry();
    this.router = new CapabilityRouter(this.registry);
    this.x402 = new X402Router(this.registry);
    
    // Initialize RPC pools for common chains
    this.rpcPool = new RPCPool(
      this.registry.getRPC(config?.defaultChain || "mantle")
    );
  }

  async deploy(
    bytecode: string,
    abi: any[],
    constructorArgs: any[],
    chain: string
  ) {
    const adapter = await this.router.route("deploy", chain);
    return await adapter.deploy(bytecode, abi, constructorArgs);
  }

  async call(
    contractAddress: string,
    method: string,
    args: any[],
    chain: string
  ) {
    const adapter = await this.router.route("call", chain);
    return await adapter.call(contractAddress, method, args);
  }

  async estimateGas(
    method: string,
    args: any[],
    chain: string
  ): Promise<bigint> {
    const adapter = await this.router.route("call", chain);
    return await adapter.estimateGas(method, args);
  }

  async sendPayment(
    amount: bigint,
    chain: string,
    action: string
  ) {
    return await this.x402.routePayment(amount, chain, action);
  }

  // Query utilities
  async getBalance(address: string, chain: string): Promise<bigint> {
    const adapter = await this.router.route("call", chain);
    return await adapter.getBalance(address);
  }

  async addChain(chain: string, config: NetworkConfig) {
    this.registry.addRuntime(chain, config);
  }
}

// Usage
const hk = new HyperKit({ defaultChain: "mantle" });

// Deploy same contract to multiple chains
const codes = {
  mantle: await hk.deploy(BYTECODE, ABI, [arg1, arg2], "mantle"),
  metis: await hk.deploy(BYTECODE, ABI, [arg1, arg2], "metis"),
  solana: await hk.deploy(BYTECODE, ABI, [arg1, arg2], "solana")
};
```

**Acceptance Criteria**:
- [ ] Main SDK class exported
- [ ] All methods functional
- [ ] Usage examples work
- [ ] Error handling comprehensive

**Estimate**: 6h

#### Task SDK-10: React Hooks (SDK integration)
```typescript
// src/react/useHyperKit.ts
export function useHyperKit(defaultChain: string = "mantle") {
  const [sdk] = useState(() => new HyperKit({ defaultChain }));
  const [chain, setChain] = useState(defaultChain);
  const [loading, setLoading] = useState(false);

  const deploy = async (bytecode: string, abi: any[], args: any[]) => {
    setLoading(true);
    try {
      return await sdk.deploy(bytecode, abi, args, chain);
    } finally {
      setLoading(false);
    }
  };

  const call = async (address: string, method: string, args: any[]) => {
    setLoading(true);
    try {
      return await sdk.call(address, method, args, chain);
    } finally {
      setLoading(false);
    }
  };

  const estimateGas = async (method: string, args: any[]) => {
    return await sdk.estimateGas(method, args, chain);
  };

  return {
    sdk,
    chain,
    setChain,
    deploy,
    call,
    estimateGas,
    loading
  };
}

// Usage
export function DeployForm() {
  const { deploy, chain, setChain, loading } = useHyperKit();

  const handleDeploy = async () => {
    const tx = await deploy(BYTECODE, ABI, []);
    console.log("Deployed to:", tx.address);
  };

  return (
    <div>
      <select value={chain} onChange={(e) => setChain(e.target.value)}>
        <option>mantle</option>
        <option>metis</option>
        <option>solana</option>
      </select>
      <button onClick={handleDeploy} disabled={loading}>
        Deploy {loading && "..."}
      </button>
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] useHyperKit hook works
- [ ] Chain switching functional
- [ ] Loading states correct
- [ ] Error boundaries present

**Estimate**: 5h

### WEEK 6-7: Documentation & Testing

#### Task SDK-11: E2E Tests
```typescript
// test/e2e.test.ts
describe("HyperKit E2E", () => {
  let sdk: HyperKit;

  beforeEach(() => {
    sdk = new HyperKit({ defaultChain: "mantle" });
  });

  describe("EVM Chains", () => {
    it("should deploy to Mantle", async () => {
      const tx = await sdk.deploy(SIMPLE_COUNTER, ABI, [0], "mantle");
      expect(tx.address).toMatch(/^0x/);
      expect(tx.blockNumber).toBeGreaterThan(0);
    });

    it("should call contract on Metis", async () => {
      const result = await sdk.call(
        CONTRACT_ADDRESS,
        "count",
        [],
        "metis"
      );
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it("should estimate gas accurately", async () => {
      const estimated = await sdk.estimateGas("increment", [], "mantle");
      expect(estimated).toBeGreaterThan(0n);
    });
  });

  describe("Non-EVM Chains", () => {
    it("should deploy to Solana", async () => {
      const tx = await sdk.deploy(SOLANA_PROGRAM, ANCHOR_IDL, [], "solana");
      expect(tx.address).toMatch(/^[1-9A-HJ-NP-Z]{40,50}$/);
    });

    it("should call SUI move contract", async () => {
      const tx = await sdk.call(
        SUI_PACKAGE_ID,
        "increment",
        [],
        "sui"
      );
      expect(tx).toBeDefined();
    });
  });

  describe("x402 Payment Routing", () => {
    it("should route to Thirdweb on Avalanche", async () => {
      const payment = await sdk.sendPayment(
        parseUnits("1", 6),  // 1 USDC
        "avalanche",
        "deployment"
      );
      expect(payment.facilitator).toBe("thirdweb_x402");
      expect(payment.paymentUrl).toBeDefined();
    });

    it("should route to LazAI on Metis", async () => {
      const payment = await sdk.sendPayment(
        parseUnits("1", 6),
        "metis",
        "agent_run"
      );
      expect(payment.facilitator).toBe("lazai");
      expect(payment.txHash).toBeDefined();
    });
  });

  describe("Multi-Chain Deploy", () => {
    it("should deploy same contract to 3 chains", async () => {
      const chains = ["mantle", "metis", "solana"];
      const deployments = await Promise.all(
        chains.map((chain) =>
          sdk.deploy(BYTECODE, ABI, [], chain)
        )
      );

      expect(deployments).toHaveLength(3);
      deployments.forEach((tx) => expect(tx.address).toBeDefined());
    });
  });
});
```

**Acceptance Criteria**:
- [ ] All E2E tests pass
- [ ] Coverage > 80%
- [ ] Tested on all 3 chain types
- [ ] CI/CD integration (GitHub Actions)

**Estimate**: 10h

#### Task SDK-12: Documentation & Guides
- [ ] API documentation (TypeDoc)
- [ ] Migration guide (existing SDK → HyperKit)
- [ ] Example projects (NextJS, React, vanilla TS)
- [ ] Chain configuration guide
- [ ] Performance tuning
- [ ] Troubleshooting guide

**Estimate**: 8h

---

## SDK REPOSITORY: SUCCESS METRICS

| Metric | Target | Threshold |
|--------|--------|-----------|
| **Supported Networks** | 100+ | All major chains |
| **Adapter Test Coverage** | 85%+ | per adapter |
| **x402 Facilitators** | 4+ | All primary |
| **API Response Time** | <300ms | p99 |
| **RPC Failover Rate** | <1% | errors per 10k requests |
| **npm Package Size** | <500KB | gzip |
| **npm Weekly Downloads** | 1000+ | by month 2 |

---

# PROPOSAL 3: HYPERAGENT REPOSITORY
## AI Orchestrator & Intelligent Contract Automation

### Repository: `Hyperkit-Labs/hyperagent`

**Purpose**: AI-powered lifecycle automation that turns prompts into audited, deployed smart contracts.

**Scope**: ROMA agent, RAG pipeline, audit orchestration, TEE integration  
**Dependencies**: Uses `@hyperkit/sdk` + `@hyperkit/wallet`  
**Type**: Python (ROMA/DSPy) + FastAPI backend + Dashboard frontend

---

## DELIVERABLES (8 Weeks)

### WEEK 1-2: ROMA Integration & Planner

#### Task HA-1: ROMA Initialization & Planner
```python
# hyperagent/orchestrator/roma_agent.py
from roma_dspy import ROMA
from firecrawl_mcp import Firecrawl

class HyperAgent:
    def __init__(self):
        self.roma = ROMA(
            model="gpt-5-turbo",  # Fast planning
            profile="crypto_agent"
        )
        self.firecrawl = Firecrawl()
        self.state = {}

    async def plan(self, prompt: str) -> Plan:
        """
        Decompose user prompt into subtasks
        Returns: [design, generate, audit, test, deploy]
        """
        rag_context = await self.firecrawl.scrape([
            "https://github.com/Uniswap/v4-core/blob/main/README.md",
            "https://docs.aave.com/",
            "https://curve.readthedocs.io/"
        ])

        plan_prompt = f"""
        User Request: {prompt}
        
        Latest Documentation:
        {rag_context}
        
        Generate a JSON plan with these phases:
        1. "design": Architecture + data structures
        2. "generate": Solidity code generation
        3. "audit": Security analysis
        4. "test": Comprehensive testing
        5. "deploy": On-chain deployment
        
        For each phase, list subtasks with dependencies.
        """

        plan_output = await self.roma.asolve(plan_prompt, tools=[self.firecrawl])
        
        return Plan.parse_obj(plan_output)

async def plan_dex_deployment():
    agent = HyperAgent()
    plan = await agent.plan(
        "Build a DEX on Mantle with x402 payments, max gas 100gwei, "
        "based on Uniswap V4, with AMM curve optimization"
    )
    
    print(plan)
    # Output:
    # {
    #   "phases": [
    #     {
    #       "name": "design",
    #       "subtasks": [
    #         "Design AMM curve math",
    #         "Define state variables",
    #         "Plan event emissions"
    #       ]
    #     },
    #     ...
    #   ],
    #   "estimatedTime": 87,
    #   "riskLevel": "medium"
    # }
```

**Acceptance Criteria**:
- [ ] ROMA planner decomposes prompts into phases
- [ ] Firecrawl RAG context included in planning
- [ ] Plan output structured + executable
- [ ] Tested with 5+ prompt variations

**Estimate**: 10h

#### Task HA-2: Firecrawl RAG Pipeline
```python
# hyperagent/rag/firecrawl_rag.py
from firecrawl_mcp import Firecrawl
from pinecone import Pinecone
import json

class RagPipeline:
    def __init__(self):
        self.firecrawl = Firecrawl()
        self.pinecone = Pinecone(api_key=PINECONE_API_KEY)
        self.index = self.pinecone.Index("hyperkit-docs")

    async def crawl_and_index(self):
        """
        Crawl latest docs for Uniswap, Aave, Curve, Yearn, etc.
        Index into vector DB for semantic search
        """
        docs = {
            "uniswap_v4": "https://github.com/Uniswap/v4-core",
            "aave_v3": "https://docs.aave.com/",
            "curve": "https://curve.readthedocs.io/",
            "yearn": "https://docs.yearn.finance/",
            "makerdao": "https://github.com/makerdao/dss",
            "compound": "https://compound.finance/docs/v3",
        }

        for name, url in docs.items():
            print(f"Crawling {name}...")
            
            content = await self.firecrawl.crawl(url, {
                "includeMarkdown": True,
                "markdownTransformer": "gfm",
                "maxDepth": 5
            })

            # Chunk content
            chunks = self.chunk_content(content, chunk_size=1000)

            # Generate embeddings + metadata
            for i, chunk in enumerate(chunks):
                embedding = await self.generate_embedding(chunk)
                
                self.index.upsert(
                    vectors=[(
                        f"{name}_{i}",
                        embedding,
                        {
                            "source": name,
                            "url": url,
                            "text": chunk,
                            "type": "documentation"
                        }
                    )]
                )

    async def search(self, query: str, top_k: int = 5) -> List[Document]:
        """
        Semantic search for relevant patterns
        """
        embedding = await self.generate_embedding(query)
        results = self.index.query(
            vector=embedding,
            top_k=top_k,
            includeMetadata=True
        )

        return [
            Document(
                source=match.metadata["source"],
                text=match.metadata["text"],
                url=match.metadata["url"]
            )
            for match in results.matches
        ]

    async def generate_context(self, prompt: str) -> str:
        """
        Generate RAG context for a given prompt
        """
        relevant_docs = await self.search(prompt)
        
        context = "## Relevant Documentation\n\n"
        for doc in relevant_docs:
            context += f"### From {doc.source}\n{doc.text}\n\n"
        
        return context

async def test_rag():
    rag = RagPipeline()
    
    # First time: crawl and index
    await rag.crawl_and_index()  # ~5-10 minutes
    
    # Subsequent: search
    context = await rag.generate_context(
        "How do I implement a custom AMM curve?"
    )
    print(context)
```

**Acceptance Criteria**:
- [ ] 6+ docs crawled and indexed
- [ ] Vector DB (Pinecone) operational
- [ ] Semantic search working
- [ ] Context generation accurate

**Estimate**: 12h

### WEEK 2-3: Code Generation & Auditing

#### Task HA-3: Solidity Code Generator
```python
# hyperagent/codegen/solidity_generator.py
from jinja2 import Template
import json

class SolidityGenerator:
    def __init__(self, rag_context: str):
        self.rag_context = rag_context
        self.model = "claude-opus-4.5"  # Best for code

    async def generate_contracts(
        self,
        specification: ContractSpec
    ) -> GeneratedContracts:
        """
        Generate Solidity contracts based on spec + RAG context
        """
        prompt = f"""
        Contract Specification:
        {json.dumps(specification.dict(), indent=2)}
        
        Relevant Code Examples:
        {self.rag_context}
        
        Generate production-ready Solidity contracts that:
        1. Follow the spec exactly
        2. Use patterns from the examples
        3. Are auditable (clear logic, no complex tricks)
        4. Include natspec comments
        5. Have event emissions
        6. Are gas-efficient
        
        Return a JSON object with:
        {{
          "contracts": [
            {{
              "name": "ContractName",
              "code": "pragma solidity ^0.8.0;\n...",
              "storage": [
                {{"name": "counter", "type": "uint256"}}
              ],
              "functions": [
                {{"name": "increment", "selector": "0xd09de08a"}}
              ]
            }}
          ],
          "imports": ["@openzeppelin/contracts/..."],
          "notes": "..."
        }}
        """

        response = await self.call_llm(prompt)
        generated = json.loads(response)

        return GeneratedContracts(
            contracts=[
                Contract(
                    name=c["name"],
                    code=c["code"],
                    storage=c["storage"],
                    functions=c["functions"]
                )
                for c in generated["contracts"]
            ],
            imports=generated["imports"],
            notes=generated["notes"]
        )

    async def call_llm(self, prompt: str) -> str:
        """
        Call Claude with retry logic
        """
        for attempt in range(3):
            try:
                message = await self.client.messages.create(
                    model=self.model,
                    max_tokens=4096,
                    messages=[{"role": "user", "content": prompt}]
                )
                return message.content[0].text
            except RateLimitError:
                if attempt < 2:
                    await asyncio.sleep(2 ** attempt)  # Exponential backoff
                else:
                    raise

async def test_codegen():
    spec = ContractSpec(
        name="SimpleSwap",
        type="dex",
        functions=[
            FunctionSpec(
                name="swap",
                params=["tokenIn: address", "amountIn: uint256", "minOut: uint256"],
                returns=["amountOut: uint256"],
                description="Swap tokenIn for tokenOut with slippage protection"
            ),
            FunctionSpec(
                name="addLiquidity",
                params=["token0: address", "token1: address", "amount0: uint256", "amount1: uint256"],
                returns=["liquidity: uint256"],
                description="Add liquidity to AMM"
            )
        ],
        constraints=["Gas limit: 100 gwei", "x402 payment integration"],
        chain="mantle"
    )

    generator = SolidityGenerator("<!-- RAG context -->")
    contracts = await generator.generate_contracts(spec)

    print(contracts.contracts[0].code)  # Full Solidity code
```

**Acceptance Criteria**:
- [ ] Generates valid Solidity (compiles with Foundry)
- [ ] Follows patterns from RAG docs
- [ ] Includes storage layout + functions
- [ ] Tested on 5+ contract types

**Estimate**: 14h

#### Task HA-4: Slither + AI Audit Orchestration
```python
# hyperagent/audit/audit_orchestrator.py
import subprocess
import json
from typing import List

class AuditOrchestrator:
    def __init__(self):
        self.slither_path = "/usr/local/bin/slither"
        self.llm = "gpt-5-turbo"  # Fast analysis

    async def run_full_audit(self, contract_code: str) -> AuditReport:
        """
        Run comprehensive audit: static + AI analysis
        """
        # 1. Slither static analysis
        slither_results = await self.run_slither(contract_code)

        # 2. AI semantic analysis
        ai_results = await self.analyze_with_ai(contract_code, slither_results)

        # 3. Aggregate
        report = AuditReport(
            timestamp=datetime.now(),
            contract_hash=keccak256(contract_code),
            slither_findings=slither_results,
            ai_findings=ai_results,
            severity=max(
                slither_results.severity,
                ai_results.severity
            ),
            pass_fail=self.determine_pass_fail(
                slither_results,
                ai_results
            )
        )

        return report

    async def run_slither(self, contract_code: str) -> SlitherResults:
        """
        Execute Slither static analysis
        """
        # Write contract to temp file
        with tempfile.NamedTemporaryFile(mode="w", suffix=".sol", delete=False) as f:
            f.write(contract_code)
            temp_path = f.name

        try:
            result = subprocess.run(
                [self.slither_path, temp_path, "--json", "-"],
                capture_output=True,
                text=True,
                timeout=30
            )

            output = json.loads(result.stdout)

            return SlitherResults(
                detectors=[
                    Detection(
                        type=d["type"],
                        severity=d["severity"],  # "high", "medium", "low"
                        description=d["description"],
                        sourceMapping=d.get("source_mapping")
                    )
                    for d in output.get("results", [])
                ],
                severity=self.get_max_severity(
                    output.get("results", [])
                ),
                passed=len(output.get("results", [])) == 0
            )
        finally:
            os.unlink(temp_path)

    async def analyze_with_ai(
        self,
        contract_code: str,
        slither_results: SlitherResults
    ) -> AIAuditResults:
        """
        AI-powered semantic analysis
        """
        slither_summary = "\n".join([
            f"- [{d.severity}] {d.type}: {d.description}"
            for d in slither_results.detectors
        ])

        prompt = f"""
        Review this Solidity contract for security issues:
        
        ```solidity
        {contract_code}
        ```
        
        Slither found:
        {slither_summary}
        
        Perform a security review checking:
        1. Reentrancy vulnerabilities
        2. Integer overflow/underflow (even with 0.8+)
        3. Unchecked external calls
        4. Access control gaps
        5. Logic errors in AMM/swap functions
        6. Gas optimization opportunities
        
        Return JSON:
        {{
          "vulnerabilities": [
            {{
              "type": "reentrancy",
              "severity": "high",
              "location": "line 42",
              "description": "...",
              "recommendation": "..."
            }}
          ],
          "positives": ["Well-structured state", "Good natspec", ...],
          "summary": "..."
        }}
        """

        response = await self.call_claude(prompt)
        analysis = json.loads(response)

        return AIAuditResults(
            vulnerabilities=[
                Vulnerability(
                    type=v["type"],
                    severity=v["severity"],
                    location=v["location"],
                    description=v["description"],
                    recommendation=v["recommendation"]
                )
                for v in analysis.get("vulnerabilities", [])
            ],
            positives=analysis.get("positives", []),
            summary=analysis.get("summary", ""),
            severity=max(
                [v["severity"] for v in analysis.get("vulnerabilities", ["low"])]
            )
        )

    def determine_pass_fail(
        self,
        slither: SlitherResults,
        ai: AIAuditResults
    ) -> bool:
        """
        Pass if: no HIGH severity findings
        """
        high_slither = any(d.severity == "high" for d in slither.detectors)
        high_ai = any(v.severity == "high" for v in ai.vulnerabilities)

        return not (high_slither or high_ai)

async def test_audit():
    auditor = AuditOrchestrator()

    # Good contract
    good_code = """
    pragma solidity ^0.8.0;
    
    contract Counter {
        uint256 public count;
        
        function increment() external {
            count++;
        }
    }
    """

    report = await auditor.run_full_audit(good_code)
    print(f"Pass: {report.pass_fail}")  # True
    print(f"Findings: {len(report.ai_findings.vulnerabilities)}")  # 0
```

**Acceptance Criteria**:
- [ ] Slither execution + parsing
- [ ] AI analysis functional
- [ ] Vulnerability detection working
- [ ] Pass/fail logic correct

**Estimate**: 12h

### WEEK 3-4: TEE Integration & Attestation

#### Task HA-5: LazAI + Phala TEE Integration
```python
# hyperagent/tee/lazai_tee.py
from alith import TappdClient
import json

class LazAITEEWorker:
    def __init__(self):
        self.tee_client = TappdClient(
            endpoint="https://phala.metis.io",
            worker_key=os.getenv("PHALA_WORKER_KEY")
        )

    async def attested_audit(self, contract_code: str) -> AttestedAuditResult:
        """
        Run audit inside TEE, get cryptographic attestation
        """
        # Audit code compiled + deployed in Phala TEE
        audit_script = f"""
        import hashlib
        import json
        
        contract_code = {repr(contract_code)}
        
        # Run Slither inside TEE
        import subprocess
        result = subprocess.run(
            ["slither", "-", "--json"],
            input=contract_code,
            capture_output=True
        )
        
        findings = json.loads(result.stdout)
        
        # Deterministic hash of input + output
        audit_hash = hashlib.sha256(
            contract_code.encode() +
            json.dumps(findings).encode()
        ).hexdigest()
        
        print(json.dumps({{
            "contract_hash": hashlib.sha256(contract_code.encode()).hexdigest(),
            "audit_hash": audit_hash,
            "findings_count": len(findings.get("results", [])),
            "passed": len(findings.get("results", [])) == 0
        }}))
        """

        # Submit to TEE worker
        result = await self.tee_client.execute_remote(
            code=audit_script,
            timeout=60,
            encrypted=True  # End-to-end encrypted
        )

        # Parse attested output
        output = json.loads(result.output)

        # Get attestation quote (proof that code ran in TEE)
        attestation = result.attestation

        return AttestedAuditResult(
            contractHash=output["contract_hash"],
            auditHash=output["audit_hash"],
            findingsCount=output["findings_count"],
            passed=output["passed"],
            attestationQuote=attestation,
            executedAt=datetime.now(),
            teeProvider="phala"
        )

    async def attested_build(
        self,
        contracts: List[Contract],
        solc_version: str = "0.8.24"
    ) -> AttestedBuildResult:
        """
        Compile contracts inside TEE, return signed bytecode
        """
        build_script = f"""
        import subprocess
        import json
        import hashlib
        
        # Compile with Foundry in TEE
        result = subprocess.run(
            [
                "solc",
                "--version", "{solc_version}",
                "--optimize",
                "--optimize-runs", "200",
                "-",
                "--bin", "--abi"
            ],
            input={repr(chr(10).join([c.code for c in contracts]))},
            capture_output=True
        )
        
        artifacts = {{}}
        for contract in {json.dumps([c.name for c in contracts])}:
            artifacts[contract] = {{
                "bytecode": "0x..." + result.stdout.decode(),
                "hash": hashlib.sha256(result.stdout).hexdigest()
            }}
        
        # Build hash = deterministic hash of inputs + outputs
        build_hash = hashlib.sha256(
            json.dumps(artifacts).encode()
        ).hexdigest()
        
        print(json.dumps({{
            "artifacts": artifacts,
            "buildHash": build_hash,
            "solcVersion": "{solc_version}",
            "timestamp": "{datetime.now().isoformat()}"
        }}))
        """

        result = await self.tee_client.execute_remote(
            code=build_script,
            timeout=120
        )

        output = json.loads(result.output)

        return AttestedBuildResult(
            artifacts={
                name: Artifact(
                    bytecode=info["bytecode"],
                    hash=info["hash"]
                )
                for name, info in output["artifacts"].items()
            },
            buildHash=output["buildHash"],
            attestationQuote=result.attestation,
            solcVersion=output["solcVersion"]
        )

async def test_tee():
    tee = LazAITEEWorker()

    # Run audit in TEE
    result = await tee.attested_audit("pragma solidity ^0.8.0;\n...")
    print(f"Audit passed: {result.passed}")
    print(f"Attestation: {result.attestationQuote[:50]}...")
```

**Acceptance Criteria**:
- [ ] Phala TEE client connection working
- [ ] Audit execution in enclave
- [ ] Attestation quote generated
- [ ] Build artifacts signed

**Estimate**: 12h

#### Task HA-6: EigenCompute Integration (Optional)
```python
# hyperagent/tee/eigen_compute.py
from eigencloud import EigenCloudClient

class EigenComputeWorker:
    def __init__(self):
        self.client = EigenCloudClient(
            api_key=os.getenv("EIGENCLOUD_API_KEY")
        )

    async def run_verifiable_agent_task(
        self,
        agent_code: str,
        dependencies: List[str],
        timeout: int = 300
    ) -> VerifiableTaskResult:
        """
        Run complex agent task on EigenCompute
        Verifiable by restaking network
        """
        dockerfile = f"""
        FROM python:3.11-slim
        
        RUN pip install {' '.join(dependencies)}
        
        COPY agent.py /app/agent.py
        WORKDIR /app
        
        ENTRYPOINT ["python", "agent.py"]
        """

        # Submit container to EigenCompute
        job = await self.client.submit_job(
            dockerfile=dockerfile,
            code=agent_code,
            container_name="hyperagent-worker",
            timeout=timeout,
            attestation_required=True  # Get verifiable output
        )

        # Wait for execution
        result = await job.wait_for_completion()

        return VerifiableTaskResult(
            jobId=result.job_id,
            output=result.output,
            exitCode=result.exit_code,
            executionTime=result.execution_time,
            attestationProof=result.attestation,  # Proof restakers verified
            verifiedAt=datetime.now()
        )

async def test_eigen():
    worker = EigenComputeWorker()

    # Run x402 payment agent on EigenCompute
    result = await worker.run_verifiable_agent_task(
        agent_code="""
        import requests
        
        # Multi-chain x402 payment orchestration
        networks = ["mantle", "hyperion", "solana"]
        
        for net in networks:
            print(f"Processing {net}...")
            # Complex logic that EigenCompute verifies
        """,
        dependencies=["requests", "web3"],
        timeout=300
    )

    print(f"Verified execution: {result.attestationProof is not None}")
```

**Acceptance Criteria**:
- [ ] EigenCloud container submission
- [ ] Job completion polling
- [ ] Attestation proof retrieval
- [ ] Multi-chain agent logic support

**Estimate**: 8h

### WEEK 4-5: Deployment & Monitoring

#### Task HA-7: Foundry Deployment Integration
```python
# hyperagent/deployment/foundry_deployer.py
import subprocess
import json
import os

class FoundryDeployer:
    def __init__(self, chain: str, rpc: str, private_key: str):
        self.chain = chain
        self.rpc = rpc
        self.private_key = private_key

    async def deploy_contracts(
        self,
        contracts: List[Contract],
        constructor_args: Dict[str, List[str]],
        verify: bool = True
    ) -> DeploymentResult:
        """
        Deploy contracts using Foundry forge
        """
        # Write contracts to temp directory
        with tempfile.TemporaryDirectory() as tmpdir:
            src_dir = os.path.join(tmpdir, "src")
            os.makedirs(src_dir)

            # Write contract files
            for contract in contracts:
                path = os.path.join(src_dir, f"{contract.name}.sol")
                with open(path, "w") as f:
                    f.write(contract.code)

            # Create foundry config
            foundry_config = f"""
            [profile.default]
            src = "src"
            out = "out"
            libs = ["lib"]
            
            [etherscan]
            mantle = {{key = "{os.getenv('MANTLE_ETHERSCAN_KEY')}"}}
            metis = {{key = "{os.getenv('METIS_ETHERSCAN_KEY')}"}}
            """

            with open(os.path.join(tmpdir, "foundry.toml"), "w") as f:
                f.write(foundry_config)

            # Deploy each contract
            deployments = {}
            for contract in contracts:
                cmd = [
                    "forge", "create",
                    f"src/{contract.name}.sol:{contract.name}",
                    f"--rpc-url={self.rpc}",
                    f"--private-key={self.private_key}",
                    "--json"
                ]

                # Add constructor args
                if contract.name in constructor_args:
                    args = " ".join(constructor_args[contract.name])
                    cmd.append(f"--constructor-args={args}")

                result = subprocess.run(
                    cmd,
                    cwd=tmpdir,
                    capture_output=True,
                    text=True,
                    timeout=120
                )

                output = json.loads(result.stdout)
                deployments[contract.name] = {
                    "address": output["deployedTo"],
                    "transactionHash": output["transactionHash"],
                    "blockNumber": output["blockNumber"]
                }

                # Verify on block explorer
                if verify:
                    await self.verify_contract(
                        contract.name,
                        deployments[contract.name]["address"],
                        constructor_args.get(contract.name, [])
                    )

            return DeploymentResult(
                deployments=deployments,
                chain=self.chain,
                timestamp=datetime.now()
            )

    async def verify_contract(
        self,
        contract_name: str,
        address: str,
        constructor_args: List[str]
    ):
        """
        Verify contract source on block explorer
        """
        cmd = [
            "forge", "verify-contract",
            address,
            f"src/{contract_name}.sol:{contract_name}",
            f"--verifier=etherscan",
            f"--verifier-url=https://api.{self.chain}.etherscan.io/api",
            f"--compiler-version=v0.8.24"
        ]

        if constructor_args:
            cmd.append(f"--constructor-args={constructor_args}")

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60
        )

        if result.returncode != 0:
            print(f"Verification warning: {result.stderr}")

async def test_deploy():
    deployer = FoundryDeployer(
        chain="mantle",
        rpc="https://rpc.mantle.xyz",
        private_key=os.getenv("DEPLOY_KEY")
    )

    result = await deployer.deploy_contracts(
        contracts=[
            Contract(name="Counter", code="pragma solidity ^0.8.0;\n...")
        ],
        constructor_args={"Counter": []}
    )

    print(f"Deployed to {result.deployments['Counter']['address']}")
```

**Acceptance Criteria**:
- [ ] Foundry install + config
- [ ] forge create working
- [ ] Block explorer verification
- [ ] Multi-contract deployment

**Estimate**: 10h

#### Task HA-8: Real-Time Monitoring (Moralis + Dune)
```python
# hyperagent/monitoring/monitor.py
from moralis import streams_api
import aiohttp

class HyperAgentMonitor:
    def __init__(self):
        self.moralis_streams = StreamsAPI(
            api_key=os.getenv("MORALIS_API_KEY")
        )
        self.dune = DuneClient(api_key=os.getenv("DUNE_API_KEY"))

    async def setup_deployment_webhook(self, contract_address: str, chain: str):
        """
        Create Moralis stream for deployment events
        """
        stream = await self.moralis_streams.create_stream({
            "chains": [self.chain_id_from_name(chain)],
            "description": f"Monitor {contract_address} on {chain}",
            "webhookUrl": f"{WEBHOOK_BASE}/deployments",
            "includeContractLogs": True,
            "includeContractNativeTxs": True,
            "topic0": [
                "Transfer(address,address,uint256)",  # ERC-20
                "Swap(address,uint256,uint256,uint256,uint256,address)"  # DEX
            ]
        })

        return stream

    async def track_tvl(self, contracts: Dict[str, str], chain: str):
        """
        Track TVL using Dune SQL
        """
        dune_query = f"""
        SELECT
            '{chain}' as chain,
            COUNT(DISTINCT holder) as unique_holders,
            SUM(balance) as total_tvl,
            NOW() as timestamp
        FROM erc20_balances
        WHERE token_address IN ({','.join(f"'{addr}'" for addr in contracts.values())})
            AND chain = '{chain}'
        GROUP BY 1, 4
        """

        result = await self.dune.execute_query(dune_query)
        return result

    async def monitor_deployed_app(
        self,
        deployment_id: str,
        contracts: Dict[str, str],
        chain: str
    ):
        """
        Start monitoring newly deployed app
        """
        # Create Moralis webhook
        stream = await self.setup_deployment_webhook(
            list(contracts.values())[0],
            chain
        )

        # Schedule TVL tracking
        while True:
            tvl_data = await self.track_tvl(contracts, chain)
            
            # Emit to dashboard
            await self.emit_to_dashboard("tvl_update", {
                "deploymentId": deployment_id,
                "tvl": tvl_data,
                "timestamp": datetime.now()
            })

            await asyncio.sleep(300)  # Update every 5 minutes

async def test_monitor():
    monitor = HyperAgentMonitor()

    deployment = {
        "Dex": "0x...",
        "Router": "0x..."
    }

    # Start monitoring (runs in background)
    asyncio.create_task(
        monitor.monitor_deployed_app("dep_123", deployment, "mantle")
    )
```

**Acceptance Criteria**:
- [ ] Moralis stream creation
- [ ] Webhook event handling
- [ ] Dune TVL queries
- [ ] Dashboard updates real-time

**Estimate**: 8h

### WEEK 5-6: Agent Orchestration & Workflow

#### Task HA-9: Full Agent Lifecycle
```python
# hyperagent/agent/agent.py
from roma_dspy import ROMA

class HyperAgent:
    def __init__(self):
        self.roma = ROMA(model="gpt-5-turbo", profile="crypto_agent")
        self.rag = RagPipeline()
        self.codegen = SolidityGenerator()
        self.audit = AuditOrchestrator()
        self.tee = LazAITEEWorker()
        self.deployer = FoundryDeployer()
        self.monitor = HyperAgentMonitor()

    async def build_dapp(self, user_prompt: str) -> BuildResult:
        """
        End-to-end: prompt → deployed + audited dApp
        """
        print(f"🚀 Starting HyperAgent build: {user_prompt}")

        # 1. PLAN
        print("📋 Planning...")
        rag_context = await self.rag.generate_context(user_prompt)
        plan = await self.roma.asolve(
            f"{user_prompt}\n\nContext: {rag_context}",
            tools=[self.rag.firecrawl]
        )
        print(f"✓ Plan: {plan}")

        # 2. DESIGN + SPEC
        print("🎨 Designing contracts...")
        spec = await self.extract_spec_from_plan(plan, user_prompt)

        # 3. GENERATE CODE
        print("💻 Generating Solidity...")
        generator = SolidityGenerator(rag_context)
        contracts = await generator.generate_contracts(spec)
        print(f"✓ Generated {len(contracts.contracts)} contracts")

        # 4. AUDIT (in TEE)
        print("🔐 Auditing in TEE...")
        audit_results = []
        for contract in contracts.contracts:
            result = await self.tee.attested_audit(contract.code)
            audit_results.append(result)
            print(f"  - {contract.name}: {'✓ PASS' if result.passed else '✗ FAIL'}")

        # Check if any failed
        if any(not r.passed for r in audit_results):
            return BuildResult(
                status="failed",
                reason="Audit failed",
                auditResults=audit_results
            )

        # 5. BUILD (in TEE)
        print("🔨 Building in TEE...")
        build_result = await self.tee.attested_build(contracts.contracts)
        print(f"✓ Built: {build_result.buildHash}")

        # 6. TEST
        print("✅ Testing...")
        test_results = await self.run_tests(contracts.contracts)
        print(f"✓ Tests: {len(test_results)} passed")

        # 7. DEPLOY
        print("🚀 Deploying...")
        deployment = await self.deployer.deploy_contracts(
            contracts.contracts,
            constructor_args=spec.constructorArgs
        )
        print(f"✓ Deployed!")
        for name, info in deployment.deployments.items():
            print(f"  - {name}: {info['address']}")

        # 8. MONITOR
        print("📊 Starting monitoring...")
        asyncio.create_task(
            self.monitor.monitor_deployed_app(
                deployment_id=f"dep_{int(time.time())}",
                contracts=deployment.deployments,
                chain=spec.chain
            )
        )

        return BuildResult(
            status="success",
            plan=plan,
            contracts=contracts,
            auditResults=audit_results,
            buildResult=build_result,
            deployment=deployment,
            monitoringStarted=True,
            totalTime=time.time() - start_time
        )

async def test_full_agent():
    agent = HyperAgent()

    result = await agent.build_dapp(
        "Build a DEX on Mantle with x402 payments, "
        "max gas 100gwei, based on Uniswap V4"
    )

    print(f"\nFinal Status: {result.status}")
    if result.status == "success":
        print(f"⏱️  Completed in {result.totalTime:.1f} seconds")
```

**Acceptance Criteria**:
- [ ] End-to-end build completes
- [ ] All phases executed in order
- [ ] Contracts deployed + verified
- [ ] Monitoring active
- [ ] Time < 120 seconds

**Estimate**: 14h

### WEEK 6-7: Dashboard & Observability

#### Task HA-10: Dashboard (Next.js + Recharts)
```typescript
// dashboard/app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

export default function Dashboard() {
  const [builds, setBuild] = useState([]);
  const [tvlData, setTVLData] = useState([]);
  const [selectedBuild, setSelectedBuild] = useState(null);

  useEffect(() => {
    // WebSocket: Real-time updates
    const ws = new WebSocket("wss://api.hyperkit/ws/dashboard");

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "build_progress") {
        setBuild((prev) => [...prev, data.build]);
      } else if (data.type === "tvl_update") {
        setTVLData((prev) => [...prev, data.tvl]);
      }
    };

    return () => ws.close();
  }, []);

  return (
    <div className="grid grid-cols-4 gap-4 p-8">
      {/* Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Total Builds</CardTitle>
        </CardHeader>
        <CardContent className="text-3xl font-bold">
          {builds.length}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Success Rate</CardTitle>
        </CardHeader>
        <CardContent className="text-3xl font-bold">
          {builds.filter((b) => b.status === "success").length /
            builds.length *
            100}
          %
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>TVL</CardTitle>
        </CardHeader>
        <CardContent className="text-3xl font-bold">
          ${tvlData[tvlData.length - 1]?.tvl || 0}M
        </CardContent>
      </Card>

      {/* TVL Chart */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>TVL Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart data={tvlData}>
            <CartesianGrid />
            <XAxis dataKey="timestamp" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="tvl" stroke="#2180a8" />
          </LineChart>
        </CardContent>
      </Card>

      {/* Build History */}
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Recent Builds</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
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
              {builds.map((build) => (
                <tr
                  key={build.id}
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => setSelectedBuild(build)}
                >
                  <td>{build.id.slice(0, 8)}</td>
                  <td>{build.prompt.slice(0, 50)}...</td>
                  <td>{build.chain}</td>
                  <td
                    className={
                      build.status === "success"
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {build.status}
                  </td>
                  <td>{build.totalTime.toFixed(1)}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Build Detail */}
      {selectedBuild && (
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Build: {selectedBuild.id}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold">Prompt</h3>
              <p>{selectedBuild.prompt}</p>
            </div>

            <div>
              <h3 className="font-semibold">Contracts</h3>
              {selectedBuild.contracts.map((c) => (
                <div key={c.name} className="ml-4">
                  <p>{c.name}</p>
                  <code className="text-sm">{c.address}</code>
                </div>
              ))}
            </div>

            <div>
              <h3 className="font-semibold">Audit Report</h3>
              <a
                href={selectedBuild.auditUrl}
                className="text-blue-600 underline"
              >
                View Report
              </a>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] Dashboard loads and displays
- [ ] Real-time updates via WebSocket
- [ ] Charts render correctly
- [ ] Build history queryable
- [ ] Responsive design

**Estimate**: 10h

#### Task HA-11: MLflow Integration & API Docs
```python
# hyperagent/observability/mlflow_tracking.py
import mlflow
from fastapi import FastAPI
from fastapi.responses import HTMLResponse

class AgentObservability:
    def __init__(self):
        mlflow.set_tracking_uri(MLFLOW_URI)

    async def log_build(self, build_result: BuildResult):
        """
        Log complete build to MLflow
        """
        with mlflow.start_run():
            # Parameters
            mlflow.log_param("chain", build_result.deployment.chain)
            mlflow.log_param("model", "gpt-5-turbo")
            mlflow.log_param("rag_context_docs", 6)

            # Metrics
            mlflow.log_metric("build_time_seconds", build_result.totalTime)
            mlflow.log_metric(
                "num_contracts",
                len(build_result.contracts.contracts)
            )
            mlflow.log_metric(
                "audit_findings",
                sum(len(r.vulnerabilities) for r in build_result.auditResults)
            )
            mlflow.log_metric("success", 1 if build_result.status == "success" else 0)

            # Artifacts
            mlflow.log_artifact(
                build_result.contracts.dict(),
                "contracts.json"
            )
            mlflow.log_artifact(
                build_result.deployment.dict(),
                "deployment.json"
            )

            # Tags
            mlflow.set_tag("version", "v1.0")
            mlflow.set_tag("environment", "production")

# FastAPI app
app = FastAPI()
obs = AgentObservability()

@app.post("/api/build")
async def build(prompt: str, chain: str):
    """
    POST /api/build
    Build a dApp from natural language prompt
    """
    agent = HyperAgent()
    result = await agent.build_dapp(prompt)
    
    await obs.log_build(result)
    
    return result.dict()

@app.get("/api/builds")
async def list_builds(skip: int = 0, limit: int = 10):
    """
    GET /api/builds
    List recent builds
    """
    runs = mlflow.search_runs(
        experiment_names=["HyperAgent"],
        max_results=limit
    )

    return [
        {
            "id": run.info.run_id,
            "status": run.data.params.get("status"),
            "chain": run.data.params.get("chain"),
            "build_time": run.data.metrics.get("build_time_seconds"),
            "created_at": run.info.start_time
        }
        for run in runs[skip : skip + limit]
    ]

@app.get("/docs", response_class=HTMLResponse)
async def docs():
    """Auto-generated API documentation"""
    return get_openapi_html(
        title="HyperAgent API",
        openapi_url="/openapi.json",
        swagger_ui_path="/swagger-ui"
    )
```

**Acceptance Criteria**:
- [ ] MLflow tracking functional
- [ ] API endpoints documented
- [ ] FastAPI running
- [ ] Swagger UI available

**Estimate**: 6h

### WEEK 7-8: Testing & Launch

#### Task HA-12: Integration & Load Testing
```python
# test/e2e_test.py
import pytest
import asyncio

@pytest.mark.asyncio
async def test_simple_counter():
    """Test: Build simple counter contract"""
    agent = HyperAgent()

    result = await agent.build_dapp(
        "Build a simple counter contract that increments when called"
    )

    assert result.status == "success"
    assert len(result.contracts.contracts) >= 1
    assert all(r.passed for r in result.auditResults)

@pytest.mark.asyncio
async def test_dex_deployment():
    """Test: Build DEX with x402"""
    agent = HyperAgent()

    result = await agent.build_dapp(
        "Build a DEX on Mantle with x402 payments, max gas 100gwei"
    )

    assert result.status == "success"
    assert len(result.contracts.contracts) >= 2  # Router + Factory
    assert "Dex" in [c.name for c in result.contracts.contracts]

@pytest.mark.asyncio
async def test_concurrent_builds():
    """Test: 10 concurrent builds"""
    agent = HyperAgent()

    prompts = [
        "Build counter #1",
        "Build counter #2",
        # ... 8 more
    ]

    start = time.time()
    results = await asyncio.gather(*[
        agent.build_dapp(p) for p in prompts
    ])
    elapsed = time.time() - start

    assert all(r.status == "success" for r in results)
    assert elapsed < 900  # 15 minutes for 10 builds

@pytest.mark.asyncio
async def test_load_tee_capacity():
    """Test: TEE can handle 100 audits/hour"""
    tee = LazAITEEWorker()
    audit_count = 0

    start = time.time()
    for _ in range(100):
        result = await tee.attested_audit(SAMPLE_CONTRACT_CODE)
        assert result.passed or result.passed == False  # Either is valid
        audit_count += 1

    elapsed = time.time() - start
    rate = (audit_count / elapsed) * 3600  # per hour

    assert rate >= 100, f"Only achieved {rate} audits/hour"
```

**Acceptance Criteria**:
- [ ] All tests pass
- [ ] Load test > 100 audits/hour
- [ ] Concurrent builds stable
- [ ] Coverage > 80%

**Estimate**: 10h

#### Task HA-13: Production Launch
- [ ] Security audit (external firm)
- [ ] Performance profiling
- [ ] Documentation complete
- [ ] Contributor onboarding guide
- [ ] Testnet launch (Mantle, Metis, Hyperion, Solana)
- [ ] Mainnet readiness checklist
- [ ] Support setup (Discord, GitHub Issues)

**Estimate**: 12h

---

## HYPERAGENT REPOSITORY: SUCCESS METRICS

| Metric | Target | Threshold |
|--------|--------|-----------|
| **Build Success Rate** | 95%+ | >90% |
| **Avg Build Time** | <90 seconds | target |
| **Audit Pass Rate** | 90%+ | >85% |
| **TEE Availability** | 99.5%+ | uptime |
| **Code Coverage** | 85%+ | tests |
| **Concurrent Builds** | 10+ | simultaneous |
| **API Response Time** | <500ms | p99 |
| **User Satisfaction** | 4.5/5 | rating |

---

# SUMMARY: 3-REPO IMPLEMENTATION ROADMAP

## Repository Interdependencies

```
┌─────────────────────────────────┐
│     HyperAgent (AI Brain)       │
│  - ROMA orchestrator            │
│  - Contract generation          │
│  - TEE audit + build            │
│  - Monitoring                   │
└──────────────┬──────────────────┘
               │ imports
               ▼
┌─────────────────────────────────┐
│      SDK (Core Toolkit)         │
│  - Network registry (100+)      │
│  - Chain adapters               │
│  - RPC pooling                  │
│  - x402 routing                 │
│  - Contract wrappers            │
└──────────────┬──────────────────┘
               │ imports
               ▼
┌─────────────────────────────────┐
│    AA (Wallet Layer)            │
│  - ERC-4337 + EIP-7702          │
│  - Solana Phantom               │
│  - SUI Move                     │
│  - Session keys                 │
│  - Paymaster sponsorship        │
└─────────────────────────────────┘
```

## Timeline

| Week | AA | SDK | HyperAgent |
|------|----|----|----------|
| 1-2 | ERC-4337, EIP-7702 | Network registry, Router | ROMA, Firecrawl RAG |
| 2-3 | Solana, SUI | Adapters (EVM, Solana, SUI) | Codegen, Audit |
| 3-4 | Session keys, Paymaster | Contracts, RPC pool | TEE LazAI |
| 4-5 | React hooks, UI | x402 routing, SDK core | Deployment |
| 5-6 | Testing, Security | Documentation | Monitoring |
| 6-7 | Observability | E2E tests | Agent lifecycle |
| 7-8 | Launch | Launch | Dashboard, Launch |

## Parallel Execution

**All three repos develop simultaneously:**
- **AA**: Focus on wallet UX + multi-chain support
- **SDK**: Focus on seamless developer experience
- **HyperAgent**: Focus on intelligence + automation

**Integration Points**:
- Weekly sync meetings (Tuesday 10am UTC)
- Shared Slack channel (`#hyperkit-dev`)
- Unified test environment (Mantle testnet)
- Common observability (MLflow, Dune)

## Milestones

### End of Week 2
- ✅ AA: ERC-4337 on Mantle (testnet)
- ✅ SDK: Network registry + EVM adapter
- ✅ HyperAgent: ROMA planner working, RAG indexed

### End of Week 4
- ✅ AA: Multi-chain (EVM, Solana, SUI) gasless
- ✅ SDK: x402 routing, 20 contract wrappers
- ✅ HyperAgent: Contracts generate + audit, TEE operational

### End of Week 6
- ✅ AA: Production-ready, React hooks
- ✅ SDK: Full SDK package + 100 networks
- ✅ HyperAgent: E2E agent working, <120s builds

### End of Week 8
- ✅ All three repos launched
- ✅ 100 beta users on-boarded
- ✅ Mainnet deployments live
- ✅ $50k grants acquired
- ✅ MVP revenue generation ($10k/month)

## Team Allocation

```
AA Team (4 people)
- Lead: Account Abstraction specialist
- EVM dev: EntryPoint + factory
- Solana dev: Phantom integration
- SUI dev: Move patterns

SDK Team (3 people)
- Lead: Network architect
- Backend: Chain adapters
- Frontend: React hooks

HyperAgent Team (4 people)
- Lead: ROMA/DSPy expert
- AI: LLM orchestration
- Security: TEE + audit
- DevOps: Deployment + monitoring
```

---

## FINAL SUCCESS CRITERIA (8 weeks)

### Repository Launches

✅ **@hyperkit/aa** (npm)
- Multi-chain wallets
- Gasless UX
- 1000+ weekly installs

✅ **@hyperkit/sdk** (npm)
- 100+ supported networks
- Zero chain-specific code
- 2000+ weekly installs

✅ **HyperAgent** (SaaS)
- 1 prompt → deployed dApp
- <90 second builds
- 100 beta users
- $10k MRR

### Combined Impact

- 🚀 **3 independent, modular products**
- 🤝 **Unified developer experience**
- 📊 **100+ networks supported**
- 💰 **Token value: 1 point = 0.1 $HYPE**
- 🎯 **Year 1 Revenue: $948k**

---

**Each repository is independently deployable but collectively forms HyperKit—the AI-native, network-agnostic DeFi infrastructure layer.**

Ready to execute?
