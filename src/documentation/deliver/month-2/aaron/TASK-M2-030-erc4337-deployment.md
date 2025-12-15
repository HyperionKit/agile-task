# TASK-M2-030: ERC-4337 Contract Deployment

## Metadata
- Assignee: Aaron
- Role: CTO/Project Architect
- Month: 2 (November 2025)
- Priority: P0
- Status: DONE
- Due Date: 2025-11-07
- Completed Date: 2025-11-07
- Estimated Hours: 12h
- Actual Hours: 

## Problem
Users need gasless transactions and session keys. Without ERC-4337:
- Users must hold native tokens for gas
- No session key delegation
- Cannot enable AI agent transactions
- Poor UX for new users

Current state: No account abstraction. Users pay gas manually.

## Goal
Deploy ERC-4337 account contracts to Mantle testnet. Enable session keys for HyperAgent operations.

## Success Metrics
- HyperAccount deployed to Mantle testnet
- EntryPoint 0.7 integration working
- Session key creation functional
- Gasless transactions working
- Under 5 second account creation

## Technical Scope

Files to create:
```
packages/aa/
├── contracts/
│   ├── HyperAccount.sol
│   ├── HyperAccountFactory.sol
│   └── SessionKeyManager.sol
├── scripts/
│   ├── deploy.ts
│   └── verify.ts
├── test/
│   └── HyperAccount.t.sol
└── foundry.toml
```

Dependencies:
- @account-abstraction/contracts
- @openzeppelin/contracts
- foundry

## Minimal Code

```solidity
// packages/aa/contracts/HyperAccount.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IAccount} from "@account-abstraction/contracts/interfaces/IAccount.sol";
import {UserOperation} from "@account-abstraction/contracts/interfaces/UserOperation.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

/**
 * @title HyperAccount
 * @notice ERC-4337 smart account with session key support
 * @dev Enables AI agents to execute transactions on behalf of users
 */
contract HyperAccount is IAccount, Initializable {
    using ECDSA for bytes32;
    
    // EntryPoint v0.7
    address public immutable entryPoint;
    
    // Owner of this account
    address public owner;
    
    // Session key storage
    struct SessionKey {
        address agent;
        uint48 validAfter;
        uint48 validUntil;
        uint96 spendLimit;
        uint96 spent;
        bytes4[] allowedSelectors;
        bool active;
    }
    
    mapping(bytes32 => SessionKey) public sessionKeys;
    
    // Events
    event SessionKeyCreated(bytes32 indexed keyId, address agent, uint48 validUntil);
    event SessionKeyRevoked(bytes32 indexed keyId);
    event TransactionExecuted(address indexed target, uint256 value, bytes data);
    
    // Errors
    error OnlyEntryPoint();
    error OnlyOwner();
    error InvalidSignature();
    error SessionKeyExpired();
    error SessionKeyNotActive();
    error SpendLimitExceeded();
    error SelectorNotAllowed();
    
    modifier onlyEntryPoint() {
        if (msg.sender != entryPoint) revert OnlyEntryPoint();
        _;
    }
    
    modifier onlyOwner() {
        if (msg.sender != owner && msg.sender != address(this)) revert OnlyOwner();
        _;
    }
    
    constructor(address _entryPoint) {
        entryPoint = _entryPoint;
        _disableInitializers();
    }
    
    function initialize(address _owner) external initializer {
        owner = _owner;
    }
    
    /**
     * @notice Validate UserOperation signature
     * @dev Supports both owner and session key signatures
     */
    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external onlyEntryPoint returns (uint256 validationData) {
        // Check if session key
        if (userOp.signature.length > 65) {
            return _validateSessionKey(userOp, userOpHash);
        }
        
        // Validate owner signature
        bytes32 hash = userOpHash.toEthSignedMessageHash();
        address signer = hash.recover(userOp.signature);
        
        if (signer != owner) {
            return 1; // SIG_VALIDATION_FAILED
        }
        
        // Pay prefund
        if (missingAccountFunds > 0) {
            (bool success,) = payable(entryPoint).call{value: missingAccountFunds}("");
            require(success, "prefund failed");
        }
        
        return 0;
    }
    
    /**
     * @notice Create a session key for an AI agent
     */
    function createSessionKey(
        bytes32 keyId,
        address agent,
        uint48 validUntil,
        uint96 spendLimit,
        bytes4[] calldata allowedSelectors
    ) external onlyOwner {
        sessionKeys[keyId] = SessionKey({
            agent: agent,
            validAfter: uint48(block.timestamp),
            validUntil: validUntil,
            spendLimit: spendLimit,
            spent: 0,
            allowedSelectors: allowedSelectors,
            active: true
        });
        
        emit SessionKeyCreated(keyId, agent, validUntil);
    }
    
    /**
     * @notice Revoke a session key
     */
    function revokeSessionKey(bytes32 keyId) external onlyOwner {
        sessionKeys[keyId].active = false;
        emit SessionKeyRevoked(keyId);
    }
    
    /**
     * @notice Execute a transaction
     */
    function execute(
        address target,
        uint256 value,
        bytes calldata data
    ) external onlyEntryPoint returns (bytes memory) {
        (bool success, bytes memory result) = target.call{value: value}(data);
        require(success, "execution failed");
        
        emit TransactionExecuted(target, value, data);
        return result;
    }
    
    /**
     * @notice Execute batch transactions
     */
    function executeBatch(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata datas
    ) external onlyEntryPoint {
        require(
            targets.length == values.length && values.length == datas.length,
            "length mismatch"
        );
        
        for (uint256 i = 0; i < targets.length; i++) {
            (bool success,) = targets[i].call{value: values[i]}(datas[i]);
            require(success, "batch execution failed");
        }
    }
    
    function _validateSessionKey(
        UserOperation calldata userOp,
        bytes32 userOpHash
    ) internal returns (uint256) {
        // Decode session key signature
        (bytes32 keyId, bytes memory sig) = abi.decode(
            userOp.signature,
            (bytes32, bytes)
        );
        
        SessionKey storage sk = sessionKeys[keyId];
        
        // Validate session key
        if (!sk.active) revert SessionKeyNotActive();
        if (block.timestamp > sk.validUntil) revert SessionKeyExpired();
        
        // Validate signature
        bytes32 hash = userOpHash.toEthSignedMessageHash();
        address signer = hash.recover(sig);
        
        if (signer != sk.agent) {
            return 1; // SIG_VALIDATION_FAILED
        }
        
        // Validate spend limit (simplified)
        uint256 txValue = _extractValue(userOp.callData);
        if (sk.spent + uint96(txValue) > sk.spendLimit) {
            revert SpendLimitExceeded();
        }
        sk.spent += uint96(txValue);
        
        // Return validation data with time range
        return _packValidationData(false, sk.validUntil, sk.validAfter);
    }
    
    function _extractValue(bytes calldata data) internal pure returns (uint256) {
        // Extract value from execute calldata
        if (data.length >= 68 && bytes4(data) == this.execute.selector) {
            return abi.decode(data[36:68], (uint256));
        }
        return 0;
    }
    
    function _packValidationData(
        bool sigFailed,
        uint48 validUntil,
        uint48 validAfter
    ) internal pure returns (uint256) {
        return uint256(sigFailed ? 1 : 0) |
            (uint256(validUntil) << 160) |
            (uint256(validAfter) << 208);
    }
    
    receive() external payable {}
}
```

```typescript
// packages/aa/scripts/deploy.ts
import { ethers } from "hardhat";

async function main() {
    const ENTRYPOINT_V07 = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";
    
    // Deploy Factory
    const Factory = await ethers.getContractFactory("HyperAccountFactory");
    const factory = await Factory.deploy(ENTRYPOINT_V07);
    await factory.waitForDeployment();
    
    console.log("HyperAccountFactory:", await factory.getAddress());
    
    // Deploy implementation
    const Account = await ethers.getContractFactory("HyperAccount");
    const impl = await Account.deploy(ENTRYPOINT_V07);
    await impl.waitForDeployment();
    
    console.log("HyperAccount impl:", await impl.getAddress());
}

main().catch(console.error);
```

## Acceptance Criteria
- [ ] HyperAccount.sol implemented
- [ ] Session key creation working
- [ ] Session key validation working
- [ ] Spend limits enforced
- [ ] Time-based expiration working
- [ ] HyperAccountFactory deployed
- [ ] EntryPoint 0.7 integration tested
- [ ] Contract verified on explorer
- [ ] Account creation under 5 seconds
- [ ] Gas estimation accurate
- [ ] Foundry tests passing (80%+ coverage)
- [ ] Integration test with bundler

## Dependencies
- TASK-S1-002: Configure CI/CD
- TASK-S1-005: RPC Provider Setup

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes


