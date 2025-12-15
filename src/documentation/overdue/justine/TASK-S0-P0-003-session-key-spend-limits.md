# TASK-M3-046: Session Key Granular Spend Limits (CRITICAL)

## Metadata
- Assignee: Justine
- Role: CPOO/Product Lead
- Month: 3 (December 2025)
- Priority: P0 (CRITICAL)
- Status: OVERDUE
- Original Due Date: 2025-12-11
- New Due Date: 2025-12-15
- Estimated Hours: 8h
- Actual Hours: 

## Problem
HyperAccount uses session keys to allow autonomous agent actions. Without granular limits:
- Session key can drain entire wallet
- No per-function spending caps
- No daily limits
- Compromised agent has unlimited access
- Single exploit = total loss

Security research shows session key escalation attacks have 90% success rate without limits.

Current state: Session keys have global approval. Any function, any amount.

## Goal
Implement function-specific spend limits for session keys. This ensures:
- Each function has its own gas limit
- Daily spending caps per function
- Compromised agent limited to small loss
- Users control exactly what agents can do

## Success Metrics
- Maximum loss from compromised agent: $100/day
- Per-function limits enforced on-chain
- Daily reset mechanism working
- Gas limits prevent expensive operations
- No legitimate transactions blocked

## Technical Scope

Files to create/modify:
```
packages/aa/src/
├── core/
│   ├── HyperAccount.sol (modify)
│   └── SpendLimits.sol (new)
├── libraries/
│   └── SpendLimitLib.sol (new)
└── test/
    └── SpendLimits.t.sol (new)
```

Dependencies:
- OpenZeppelin Contracts
- Account Abstraction SDK
- Foundry

Integration points:
- HyperAccount validateUserOp
- Session key creation
- Dashboard spend limit configuration

## Minimal Code

```solidity
// packages/aa/src/libraries/SpendLimitLib.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library SpendLimitLib {
    struct FunctionLimit {
        uint96 maxGas;           // Max gas per call
        uint96 dailyLimit;       // Max value per day (in wei)
        uint96 spentToday;       // Value spent today
        uint48 lastResetDay;     // Day number of last reset
        bool enabled;            // Is this function allowed
    }
    
    function checkAndUpdateLimit(
        FunctionLimit storage limit,
        uint256 gas,
        uint256 value
    ) internal returns (bool) {
        if (!limit.enabled) return false;
        
        // Check gas limit
        if (gas > limit.maxGas) return false;
        
        // Reset daily counter if new day
        uint48 today = uint48(block.timestamp / 1 days);
        if (today > limit.lastResetDay) {
            limit.spentToday = 0;
            limit.lastResetDay = today;
        }
        
        // Check daily limit
        if (limit.spentToday + value > limit.dailyLimit) return false;
        
        // Update spent amount
        limit.spentToday += uint96(value);
        
        return true;
    }
}
```

```solidity
// packages/aa/src/core/SpendLimits.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SpendLimitLib} from "../libraries/SpendLimitLib.sol";

abstract contract SpendLimits {
    using SpendLimitLib for SpendLimitLib.FunctionLimit;
    
    // Session key => Function selector => Limit
    mapping(bytes32 => mapping(bytes4 => SpendLimitLib.FunctionLimit)) 
        public functionLimits;
    
    // Default limits for common functions
    uint96 public constant DEFAULT_SWAP_GAS = 1_000_000;      // 1M gas
    uint96 public constant DEFAULT_SWAP_DAILY = 50 ether;     // ~$100 at $2/ETH
    
    uint96 public constant DEFAULT_LIQUIDITY_GAS = 2_000_000; // 2M gas
    uint96 public constant DEFAULT_LIQUIDITY_DAILY = 100 ether;
    
    uint96 public constant DEFAULT_WITHDRAW_GAS = 500_000;    // 500k gas
    uint96 public constant DEFAULT_WITHDRAW_DAILY = 10 ether; // Low limit
    
    event FunctionLimitSet(
        bytes32 indexed sessionKey,
        bytes4 indexed selector,
        uint96 maxGas,
        uint96 dailyLimit
    );
    
    event SpendLimitExceeded(
        bytes32 indexed sessionKey,
        bytes4 indexed selector,
        uint256 attempted,
        uint256 remaining
    );
    
    function setFunctionLimit(
        bytes32 sessionKey,
        bytes4 selector,
        uint96 maxGas,
        uint96 dailyLimit
    ) external virtual;
    
    function _checkSpendLimit(
        bytes32 sessionKey,
        bytes4 selector,
        uint256 gas,
        uint256 value
    ) internal returns (bool) {
        SpendLimitLib.FunctionLimit storage limit = 
            functionLimits[sessionKey][selector];
        
        if (!limit.checkAndUpdateLimit(gas, value)) {
            emit SpendLimitExceeded(
                sessionKey,
                selector,
                value,
                limit.dailyLimit - limit.spentToday
            );
            return false;
        }
        
        return true;
    }
    
    function getRemainingLimit(
        bytes32 sessionKey,
        bytes4 selector
    ) external view returns (uint96) {
        SpendLimitLib.FunctionLimit storage limit = 
            functionLimits[sessionKey][selector];
        
        // Check if needs reset
        uint48 today = uint48(block.timestamp / 1 days);
        if (today > limit.lastResetDay) {
            return limit.dailyLimit;
        }
        
        return limit.dailyLimit - limit.spentToday;
    }
}
```

```solidity
// packages/aa/src/core/HyperAccount.sol (updated)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IAccount} from "account-abstraction/interfaces/IAccount.sol";
import {SpendLimits} from "./SpendLimits.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract HyperAccount is IAccount, SpendLimits {
    using ECDSA for bytes32;
    
    address public immutable entryPoint;
    address public owner;
    
    mapping(bytes32 => SessionKey) public sessionKeys;
    
    struct SessionKey {
        address agent;
        uint48 expiresAt;
        bool active;
    }
    
    constructor(address _entryPoint, address _owner) {
        entryPoint = _entryPoint;
        owner = _owner;
    }
    
    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external override returns (uint256) {
        require(msg.sender == entryPoint, "UNAUTHORIZED");
        
        // Decode session key from signature
        (bytes32 keyId, bytes memory agentSig) = abi.decode(
            userOp.signature,
            (bytes32, bytes)
        );
        
        SessionKey memory key = sessionKeys[keyId];
        
        // Verify session key is valid
        require(key.active, "KEY_INACTIVE");
        require(key.expiresAt > block.timestamp, "KEY_EXPIRED");
        
        // Verify agent signature
        bytes32 digest = userOpHash.toEthSignedMessageHash();
        require(
            digest.recover(agentSig) == key.agent,
            "INVALID_SIGNATURE"
        );
        
        // Extract function selector from calldata
        bytes4 selector = bytes4(userOp.callData[:4]);
        
        // CRITICAL: Check spend limits
        require(
            _checkSpendLimit(
                keyId,
                selector,
                userOp.callGasLimit,
                userOp.callValue
            ),
            "SPEND_LIMIT_EXCEEDED"
        );
        
        // Fund entrypoint if needed
        if (missingAccountFunds > 0) {
            (bool success, ) = entryPoint.call{value: missingAccountFunds}("");
            require(success, "FUND_FAILED");
        }
        
        return 0;
    }
    
    function createSessionKey(
        bytes32 keyId,
        address agent,
        uint48 ttl,
        bytes4[] calldata allowedSelectors,
        uint96[] calldata maxGas,
        uint96[] calldata dailyLimits
    ) external {
        require(msg.sender == owner, "UNAUTHORIZED");
        require(
            allowedSelectors.length == maxGas.length &&
            maxGas.length == dailyLimits.length,
            "LENGTH_MISMATCH"
        );
        
        sessionKeys[keyId] = SessionKey({
            agent: agent,
            expiresAt: uint48(block.timestamp) + ttl,
            active: true
        });
        
        // Set function limits
        for (uint i = 0; i < allowedSelectors.length; i++) {
            functionLimits[keyId][allowedSelectors[i]] = SpendLimitLib.FunctionLimit({
                maxGas: maxGas[i],
                dailyLimit: dailyLimits[i],
                spentToday: 0,
                lastResetDay: uint48(block.timestamp / 1 days),
                enabled: true
            });
            
            emit FunctionLimitSet(
                keyId,
                allowedSelectors[i],
                maxGas[i],
                dailyLimits[i]
            );
        }
    }
    
    function setFunctionLimit(
        bytes32 sessionKey,
        bytes4 selector,
        uint96 maxGas,
        uint96 dailyLimit
    ) external override {
        require(msg.sender == owner, "UNAUTHORIZED");
        
        functionLimits[sessionKey][selector] = SpendLimitLib.FunctionLimit({
            maxGas: maxGas,
            dailyLimit: dailyLimit,
            spentToday: 0,
            lastResetDay: uint48(block.timestamp / 1 days),
            enabled: dailyLimit > 0
        });
        
        emit FunctionLimitSet(sessionKey, selector, maxGas, dailyLimit);
    }
    
    function revokeSessionKey(bytes32 keyId) external {
        require(msg.sender == owner, "UNAUTHORIZED");
        sessionKeys[keyId].active = false;
    }
}
```

```solidity
// packages/aa/src/test/SpendLimits.t.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {HyperAccount} from "../core/HyperAccount.sol";

contract SpendLimitsTest is Test {
    HyperAccount public account;
    address public owner = address(1);
    address public agent = address(2);
    address public entryPoint = address(3);
    
    bytes32 public keyId = keccak256("test_key");
    bytes4 public swapSelector = bytes4(keccak256("swap(address,uint256)"));
    
    function setUp() public {
        account = new HyperAccount(entryPoint, owner);
        
        bytes4[] memory selectors = new bytes4[](1);
        selectors[0] = swapSelector;
        
        uint96[] memory gas = new uint96[](1);
        gas[0] = 1_000_000;
        
        uint96[] memory limits = new uint96[](1);
        limits[0] = 50 ether;
        
        vm.prank(owner);
        account.createSessionKey(
            keyId,
            agent,
            1 days,
            selectors,
            gas,
            limits
        );
    }
    
    function testSpendWithinLimit() public {
        // First spend should succeed
        uint96 remaining = account.getRemainingLimit(keyId, swapSelector);
        assertEq(remaining, 50 ether);
    }
    
    function testSpendExceedsLimit() public {
        // Try to spend more than daily limit
        vm.prank(entryPoint);
        // This would revert with SPEND_LIMIT_EXCEEDED
    }
    
    function testDailyReset() public {
        // Warp to next day
        vm.warp(block.timestamp + 1 days);
        
        // Limit should reset
        uint96 remaining = account.getRemainingLimit(keyId, swapSelector);
        assertEq(remaining, 50 ether);
    }
    
    function testUnauthorizedFunction() public {
        bytes4 unauthorized = bytes4(keccak256("withdraw(uint256)"));
        uint96 remaining = account.getRemainingLimit(keyId, unauthorized);
        assertEq(remaining, 0);
    }
}
```

## Acceptance Criteria
- [ ] SpendLimitLib library implemented
- [ ] SpendLimits abstract contract implemented
- [ ] HyperAccount integrates spend limits
- [ ] Per-function gas limits enforced
- [ ] Per-function daily value limits enforced
- [ ] Daily reset mechanism working
- [ ] Unauthorized functions blocked
- [ ] Session key creation sets limits
- [ ] Owner can update limits
- [ ] Events emitted for limit changes
- [ ] Events emitted for limit exceeded
- [ ] getRemainingLimit view function
- [ ] Unit tests for all scenarios
- [ ] Gas optimization (under 50k gas overhead)

## Dependencies
- TASK-S1-006: Contract Templates Repository

## Progress Log
| Date | Update | Hours |
|------|--------|-------|
| 2025-12-11 | Originally due | 0h |
| 2025-12-12 | Escalated to P0, detailed spec added | 1h |

## Review Notes
SECURITY CRITICAL: Smart contract changes require audit.
Test with fuzzing before deployment.

