# TASK-M3-SEC-006: Anti-Flashloan Cooldowns

## Metadata
- Assignee: Aaron
- Role: CTO/Project Architect
- Month: 3 (December 2025)
- Priority: P1
- Status: BACKLOG
- Due Date: 2025-12-22
- Estimated Hours: 8h
- Actual Hours: 

## Problem
No anti-flashloan protection. Without protection:
- Flashloan points farming possible
- Governance attacks enabled
- Token manipulation
- Economic exploits

Current state: No cooldown mechanism for contributions.

## Goal
Implement anti-flashloan cooldowns to prevent flashloan-based points farming and governance attacks.

## Success Metrics
- Anti-flashloan cooldowns implemented
- Points farming prevented
- Governance attacks blocked
- Cooldown mechanism working
- Security audit passed

## Technical Scope

Files to create/modify:
```
packages/
└── contracts/
    └── points/
        └── AntiFlashloanPoints.sol
```

Dependencies:
- Points contract
- Governance system

## Minimal Code

```solidity
// packages/contracts/points/AntiFlashloanPoints.sol
pragma solidity ^0.8.24;

contract AntiFlashloanPoints {
    mapping(address => uint256) public lastContribution;
    uint256 public constant COOLDOWN_PERIOD = 1 hours;
    
    modifier antiFlashloan(address contributor) {
        require(
            block.timestamp - lastContribution[contributor] > COOLDOWN_PERIOD,
            "FLASHLOAN_DETECTED"
        );
        lastContribution[contributor] = block.timestamp;
        _;
    }
    
    function earnPoints(
        address contributor,
        uint256 amount,
        string memory contributionType
    ) external antiFlashloan(contributor) {
        // Award points only if cooldown passed
        // Implementation
    }
}
```

## Acceptance Criteria
- [ ] Anti-flashloan cooldowns implemented
- [ ] Points farming prevented
- [ ] Governance attacks blocked
- [ ] Cooldown mechanism working
- [ ] Security audit passed

## Dependencies
- Points contract

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes

