# TASK-M2-031: Foundry Setup

## Metadata
- Assignee: Aaron
- Role: CTO/Project Architect
- Month: 2 (November 2025)
- Priority: P1
- Status: DONE
- Due Date: 2025-11-07
- Completed Date: 2025-11-07
- Estimated Hours: 6h
- Actual Hours: 

## Problem
Need reliable Solidity compilation and testing. Without Foundry:
- Slow compilation (Hardhat)
- Limited testing capabilities
- No fuzz testing
- Manual gas reporting

Current state: No smart contract tooling configured.

## Goal
Set up Foundry for contract compilation, testing, and deployment. Enable automated testing in CI.

## Success Metrics
- All contracts compile successfully
- Test coverage above 80%
- Gas reports generated
- Fuzz tests for critical functions
- CI integration working

## Technical Scope

Files to create:
```
packages/contracts/
├── foundry.toml
├── remappings.txt
├── src/
│   └── (contract files)
├── test/
│   └── (test files)
├── script/
│   └── (deployment scripts)
└── lib/
    └── (dependencies)
```

Dependencies:
- foundry
- forge-std
- openzeppelin-contracts

## Minimal Code

```toml
# packages/contracts/foundry.toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc = "0.8.24"
optimizer = true
optimizer_runs = 200
via_ir = false
ffi = false
fs_permissions = [{ access = "read", path = "./"}]

[profile.default.fmt]
line_length = 100
tab_width = 4
bracket_spacing = true
int_types = "long"
multiline_func_header = "attributes_first"
quote_style = "double"
number_underscore = "thousands"

[profile.ci]
fuzz = { runs = 1000 }
invariant = { runs = 256 }

[rpc_endpoints]
mainnet = "${MAINNET_RPC_URL}"
mantle = "${MANTLE_RPC_URL}"
mantle_testnet = "${MANTLE_TESTNET_RPC_URL}"

[etherscan]
mantle = { key = "${MANTLE_EXPLORER_KEY}", url = "https://explorer.mantle.xyz/api" }
```

```txt
# packages/contracts/remappings.txt
@openzeppelin/=lib/openzeppelin-contracts/
@account-abstraction/=lib/account-abstraction/
forge-std/=lib/forge-std/src/
```

```solidity
// packages/contracts/test/HyperAccount.t.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {HyperAccount} from "../src/HyperAccount.sol";
import {HyperAccountFactory} from "../src/HyperAccountFactory.sol";
import {IEntryPoint} from "@account-abstraction/interfaces/IEntryPoint.sol";

contract HyperAccountTest is Test {
    HyperAccount public account;
    HyperAccountFactory public factory;
    
    address public owner;
    uint256 public ownerKey;
    
    address public agent;
    uint256 public agentKey;
    
    address constant ENTRYPOINT = 0x0000000071727De22E5E9d8BAf0edAc6f37da032;
    
    function setUp() public {
        // Create test accounts
        (owner, ownerKey) = makeAddrAndKey("owner");
        (agent, agentKey) = makeAddrAndKey("agent");
        
        // Fork Mantle for EntryPoint
        vm.createSelectFork(vm.envString("MANTLE_RPC_URL"));
        
        // Deploy factory
        factory = new HyperAccountFactory(ENTRYPOINT);
        
        // Create account
        account = HyperAccount(payable(
            factory.createAccount(owner, 0)
        ));
        
        // Fund account
        vm.deal(address(account), 10 ether);
    }
    
    function test_createSessionKey() public {
        bytes32 keyId = keccak256("session1");
        uint48 validUntil = uint48(block.timestamp + 1 days);
        uint96 spendLimit = 1 ether;
        bytes4[] memory selectors = new bytes4[](1);
        selectors[0] = account.execute.selector;
        
        vm.prank(owner);
        account.createSessionKey(
            keyId,
            agent,
            validUntil,
            spendLimit,
            selectors
        );
        
        (
            address storedAgent,
            ,
            uint48 storedValidUntil,
            uint96 storedSpendLimit,
            ,
            ,
            bool active
        ) = account.sessionKeys(keyId);
        
        assertEq(storedAgent, agent);
        assertEq(storedValidUntil, validUntil);
        assertEq(storedSpendLimit, spendLimit);
        assertTrue(active);
    }
    
    function test_revokeSessionKey() public {
        bytes32 keyId = keccak256("session1");
        bytes4[] memory selectors = new bytes4[](0);
        
        vm.startPrank(owner);
        account.createSessionKey(
            keyId,
            agent,
            uint48(block.timestamp + 1 days),
            1 ether,
            selectors
        );
        
        account.revokeSessionKey(keyId);
        vm.stopPrank();
        
        (, , , , , , bool active) = account.sessionKeys(keyId);
        assertFalse(active);
    }
    
    function testFuzz_spendLimit(uint96 limit, uint96 spend) public {
        vm.assume(limit > 0);
        vm.assume(spend <= limit);
        
        bytes32 keyId = keccak256("fuzz");
        bytes4[] memory selectors = new bytes4[](0);
        
        vm.prank(owner);
        account.createSessionKey(
            keyId,
            agent,
            uint48(block.timestamp + 1 days),
            limit,
            selectors
        );
        
        // Spend should not exceed limit
        (,,,uint96 spendLimit,,, bool active) = account.sessionKeys(keyId);
        assertEq(spendLimit, limit);
        assertTrue(active);
    }
    
    function test_onlyOwnerCanCreateSessionKey() public {
        bytes32 keyId = keccak256("unauthorized");
        bytes4[] memory selectors = new bytes4[](0);
        
        vm.prank(agent); // Not owner
        vm.expectRevert(HyperAccount.OnlyOwner.selector);
        account.createSessionKey(
            keyId,
            agent,
            uint48(block.timestamp + 1 days),
            1 ether,
            selectors
        );
    }
}
```

```bash
#!/bin/bash
# packages/contracts/scripts/setup.sh

# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Install dependencies
forge install foundry-rs/forge-std
forge install OpenZeppelin/openzeppelin-contracts
forge install eth-infinitism/account-abstraction

# Build
forge build

# Test
forge test -vvv

# Gas report
forge test --gas-report

# Coverage
forge coverage
```

## Acceptance Criteria
- [ ] Foundry installed and configured
- [ ] foundry.toml configured
- [ ] Remappings set up
- [ ] Dependencies installed (forge-std, oz, aa)
- [ ] All contracts compile
- [ ] Unit tests for HyperAccount
- [ ] Fuzz tests for critical paths
- [ ] Gas reports generated
- [ ] Coverage above 80%
- [ ] CI workflow integration
- [ ] Deployment scripts working
- [ ] Contract verification scripts

## Dependencies
- TASK-S1-001: Setup GitHub Monorepo

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes


