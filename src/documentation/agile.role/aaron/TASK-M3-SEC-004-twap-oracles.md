# TASK-M3-SEC-004: TWAP Oracles for Bridge Safety

## Metadata
- Assignee: Aaron
- Role: CTO/Project Architect
- Month: 3 (December 2025)
- Priority: P1
- Status: BACKLOG
- Due Date: 2025-12-22
- Estimated Hours: 12h
- Actual Hours: 

## Problem
No TWAP oracles for bridge safety. Without TWAP:
- Oracle manipulation attacks possible
- Price feeds can be gamed
- Bridge funds at risk
- Cross-chain attacks enabled

Current state: Single oracle used, no TWAP protection.

## Goal
Implement TWAP (Time-Weighted Average Price) oracles with multi-oracle consensus to prevent manipulation attacks on bridges.

## Success Metrics
- TWAP oracles implemented
- Multi-oracle consensus working
- Bridge safety improved
- Manipulation attacks blocked
- Security audit passed

## Technical Scope

Files to create/modify:
```
packages/
└── contracts/
    └── security/
        └── SafeOracle.sol
```

Dependencies:
- Chainlink
- Pyth
- RedStone

## Minimal Code

```solidity
// packages/contracts/security/SafeOracle.sol
pragma solidity ^0.8.24;

contract SafeOracle {
    uint256 public constant TWAP_WINDOW = 15 minutes;
    
    struct PriceData {
        uint256 price;
        uint256 timestamp;
    }
    
    mapping(address => PriceData[]) public priceHistory;
    address[] public oracles; // Chainlink, Pyth, RedStone
    
    function getPrice() external view returns (uint256) {
        uint256[] memory prices = new uint256[](oracles.length);
        
        // Get prices from all oracles
        for (uint i = 0; i < oracles.length; i++) {
            prices[i] = IOracle(oracles[i]).latestPrice();
        }
        
        // Require all oracles agree (within 1%)
        require(_pricesAgree(prices), "ORACLE_DISAGREE");
        
        // Return TWAP
        return _calculateTWAP();
    }
    
    function _pricesAgree(uint256[] memory prices) internal pure returns (bool) {
        if (prices.length < 2) return true;
        
        uint256 median = _median(prices);
        uint256 tolerance = median / 100; // 1%
        
        for (uint i = 0; i < prices.length; i++) {
            if (prices[i] > median + tolerance || prices[i] < median - tolerance) {
                return false;
            }
        }
        return true;
    }
    
    function _calculateTWAP() internal view returns (uint256) {
        uint256 total = 0;
        uint256 count = 0;
        uint256 cutoff = block.timestamp - TWAP_WINDOW;
        
        for (uint i = 0; i < oracles.length; i++) {
            PriceData[] memory history = priceHistory[oracles[i]];
            
            for (uint j = history.length; j > 0; j--) {
                if (history[j-1].timestamp < cutoff) break;
                total += history[j-1].price;
                count++;
            }
        }
        
        require(count > 0, "INSUFFICIENT_DATA");
        return total / count;
    }
    
    function _median(uint256[] memory prices) internal pure returns (uint256) {
        // Sort and return median
        // Implementation omitted for brevity
        return prices[prices.length / 2];
    }
}
```

## Acceptance Criteria
- [ ] TWAP oracles implemented
- [ ] Multi-oracle consensus working
- [ ] Bridge safety improved
- [ ] Manipulation attacks blocked
- [ ] Security audit passed

## Dependencies
None

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes

