# TASK-M3-SEC-005: Session Key Granular Limits

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
Session keys have no granular limits. Without limits:
- Wallet drainage possible
- Privilege escalation attacks
- Unlimited spending
- User funds at risk

Current state: Session keys allow all contracts, no function-specific limits.

## Goal
Implement granular session key limits: function-specific gas limits and daily spend limits per function.

## Success Metrics
- Granular limits implemented
- Function-specific limits working
- Daily spend limits enforced
- Wallet drainage prevented
- Security audit passed

## Technical Scope

Files to create/modify:
```
packages/
└── contracts/
    └── aa/
        └── HyperAccount.sol
```

Dependencies:
- ERC-4337
- Session key infrastructure

## Minimal Code

```solidity
// packages/contracts/aa/HyperAccount.sol
pragma solidity ^0.8.24;

contract HyperAccount {
    mapping(bytes4 => uint256) public MAX_GAS_PER_FUNCTION;
    mapping(address => mapping(bytes4 => uint256)) public DAILY_SPEND_LIMIT;
    mapping(address => mapping(bytes4 => uint256)) public spentToday;
    
    // Function-specific limits
    // swap(): 1M gas, $50/day
    // addLiquidity(): 2M gas, $100/day
    // withdraw(): 500k gas, $10/day
    
    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external returns (uint256) {
        require(msg.sender == entryPoint, "UNAUTHORIZED");
        
        // Extract function selector
        bytes4 selector = bytes4(userOp.callData[:4]);
        
        // Check gas limit per function
        require(
            userOp.callGasLimit <= MAX_GAS_PER_FUNCTION[selector],
            "GAS_LIMIT_EXCEEDED"
        );
        
        // Check daily spend limit
        uint256 limit = DAILY_SPEND_LIMIT[msg.sender][selector];
        require(
            spentToday[msg.sender][selector] + userOp.callGasLimit <= limit,
            "DAILY_SPEND_LIMIT_EXCEEDED"
        );
        
        // Update spent amount
        spentToday[msg.sender][selector] += userOp.callGasLimit;
        
        return 0;
    }
    
    function setFunctionLimits(
        bytes4 selector,
        uint256 maxGas,
        uint256 dailyLimit
    ) external onlyOwner {
        MAX_GAS_PER_FUNCTION[selector] = maxGas;
        DAILY_SPEND_LIMIT[msg.sender][selector] = dailyLimit;
    }
}
```

## Acceptance Criteria
- [ ] Granular limits implemented
- [ ] Function-specific limits working
- [ ] Daily spend limits enforced
- [ ] Wallet drainage prevented
- [ ] Security audit passed

## Dependencies
- TASK-M2-030: ERC-4337 Deployment

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes

