# TASK-M3-AA-005: Session Key Infrastructure

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
Session key infrastructure not built. Without infrastructure:
- Agent automation impossible
- Gasless UX not possible
- Missing core feature
- Platform incomplete

Current state: Session key system not implemented.

## Goal
Create session key infrastructure: creation, validation, smart contract permissions encoding, TTL enforcement, revocation.

## Success Metrics
- Session key creation + validation working
- Smart contract permissions encoding functional
- Agent can execute userOps without owner signature
- TTL enforcement + revocation working
- Tested end-to-end

## Technical Scope

Files to create/modify:
```
packages/
├── aa/
│   ├── src/
│   │   └── common/
│   │       └── session-keys.ts
│   └── contracts/
│       └── SessionKeyValidator.sol
```

Dependencies:
- ERC-4337
- Smart contract deployment

## Minimal Code

```typescript
// packages/aa/src/common/session-keys.ts
export interface SessionKey {
  agentAddress: string;
  permissions: Permission[];
  expiresAt: number;
  signature: string;
}

export class SessionKeyManager {
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

    const hash = keccak256(
      ethers.defaultAbiCoder.encode(
        ["address", "tuple[]", "uint256"],
        [agent, permissions, sessionKey.expiresAt]
      )
    );

    sessionKey.signature = await this.owner.signMessage(hash);
    return sessionKey;
  }

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

```solidity
// packages/aa/contracts/SessionKeyValidator.sol
contract SessionKeyValidator is BaseAuthorizationModule {
  mapping(address => mapping(bytes32 => SessionKey)) public sessionKeys;

  struct SessionKey {
    address agent;
    uint256 expiresAt;
    bytes permissions;
    bool revoked;
  }

  function validateUserOp(
    UserOperation calldata userOp,
    bytes32 userOpHash,
    bytes calldata sessionKeyData
  ) external view returns (uint256) {
    (address agent, bytes32 keyId, bytes memory sig) = abi.decode(
      sessionKeyData,
      (address, bytes32, bytes)
    );

    SessionKey memory key = sessionKeys[msg.sender][keyId];
    
    require(!key.revoked && key.expiresAt > block.timestamp, "Invalid session");
    require(_verifyPermission(userOp, key.permissions), "Disallowed operation");

    bytes32 digest = toEthSignedMessageHash(userOpHash);
    require(ecrecover(digest, ...) == agent, "Invalid signature");

    return 0;
  }
}
```

## Acceptance Criteria
- [ ] Session key creation + validation
- [ ] Smart contract permissions encoding
- [ ] Agent can execute userOps without owner signature
- [ ] TTL enforcement + revocation
- [ ] Tested end-to-end

## Dependencies
- TASK-M3-AA-001: EntryPoint V0.7 Integration

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes

