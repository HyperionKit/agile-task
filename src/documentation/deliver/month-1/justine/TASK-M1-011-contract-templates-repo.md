# TASK-M1-011: Contract Templates Repository

## Metadata
- Assignee: Justine
- Role: CPOO/Product Lead
- Month: 1 (October 2025)
- Priority: P1
- Status: DONE
- Due Date: 2025-10-07
- Completed Date: 2025-10-07
- Estimated Hours: 10h
- Actual Hours: 

## Problem
HyperAgent generates smart contracts from user prompts. Without curated templates:
- AI generates inconsistent code patterns
- No security best practices enforced
- Users must review complex code manually
- Common use cases require full generation

Current state: No templates exist. Every build starts from scratch.

## Goal
Create 5 production-ready smart contract templates covering the most common use cases. These templates:
- Follow OpenZeppelin standards
- Pass Slither analysis with zero critical issues
- Include comprehensive tests
- Serve as base for AI generation

## Success Metrics
- 5 templates completed and tested
- Zero critical Slither findings per template
- Test coverage above 90% per template
- Documentation complete for each template
- Template selection reduces build time by 50%

## Technical Scope

Files to create:
```
packages/templates/
├── package.json
├── foundry.toml
├── src/
│   ├── erc20/
│   │   ├── ERC20Token.sol
│   │   └── ERC20Token.t.sol
│   ├── erc721/
│   │   ├── ERC721NFT.sol
│   │   └── ERC721NFT.t.sol
│   ├── erc1155/
│   │   ├── ERC1155Multi.sol
│   │   └── ERC1155Multi.t.sol
│   ├── dex/
│   │   ├── SimpleDEX.sol
│   │   └── SimpleDEX.t.sol
│   └── staking/
│       ├── StakingPool.sol
│       └── StakingPool.t.sol
└── docs/
    ├── erc20.md
    ├── erc721.md
    ├── erc1155.md
    ├── dex.md
    └── staking.md
```

Dependencies:
- OpenZeppelin Contracts 5.x
- Solidity 0.8.24+
- Foundry

Integration points:
- HyperAgent template selection
- Build API
- Dashboard template picker

## Minimal Code

```solidity
// src/erc20/ERC20Token.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract ERC20Token is ERC20, ERC20Burnable, ERC20Permit, Ownable {
    uint256 public maxSupply;
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 _maxSupply,
        address initialOwner
    ) 
        ERC20(name, symbol) 
        ERC20Permit(name)
        Ownable(initialOwner) 
    {
        maxSupply = _maxSupply;
    }
    
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= maxSupply, "Exceeds max supply");
        _mint(to, amount);
    }
}
```

```solidity
// src/staking/StakingPool.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract StakingPool is ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    IERC20 public stakingToken;
    IERC20 public rewardToken;
    
    uint256 public rewardRate;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;
    
    mapping(address => uint256) public userStaked;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;
    
    uint256 public totalStaked;
    
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    
    constructor(address _stakingToken, address _rewardToken, uint256 _rewardRate) {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
        rewardRate = _rewardRate;
    }
    
    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }
    
    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) return rewardPerTokenStored;
        return rewardPerTokenStored + 
            ((block.timestamp - lastUpdateTime) * rewardRate * 1e18) / totalStaked;
    }
    
    function earned(address account) public view returns (uint256) {
        return (userStaked[account] * 
            (rewardPerToken() - userRewardPerTokenPaid[account])) / 1e18 
            + rewards[account];
    }
    
    function stake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot stake 0");
        totalStaked += amount;
        userStaked[msg.sender] += amount;
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
    }
    
    function withdraw(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot withdraw 0");
        totalStaked -= amount;
        userStaked[msg.sender] -= amount;
        stakingToken.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }
    
    function getReward() external nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            rewardToken.safeTransfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }
}
```

```solidity
// src/staking/StakingPool.t.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {StakingPool} from "./StakingPool.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";

contract StakingPoolTest is Test {
    StakingPool public pool;
    ERC20Mock public stakingToken;
    ERC20Mock public rewardToken;
    
    address public user = address(1);
    
    function setUp() public {
        stakingToken = new ERC20Mock();
        rewardToken = new ERC20Mock();
        pool = new StakingPool(
            address(stakingToken),
            address(rewardToken),
            1e18 // 1 token per second
        );
        
        stakingToken.mint(user, 1000e18);
        rewardToken.mint(address(pool), 10000e18);
    }
    
    function testStake() public {
        vm.startPrank(user);
        stakingToken.approve(address(pool), 100e18);
        pool.stake(100e18);
        vm.stopPrank();
        
        assertEq(pool.userStaked(user), 100e18);
        assertEq(pool.totalStaked(), 100e18);
    }
    
    function testEarnRewards() public {
        vm.startPrank(user);
        stakingToken.approve(address(pool), 100e18);
        pool.stake(100e18);
        vm.stopPrank();
        
        vm.warp(block.timestamp + 100);
        
        uint256 earned = pool.earned(user);
        assertGt(earned, 0);
    }
}
```

## Acceptance Criteria
- [ ] ERC-20 token template complete with mint, burn, permit
- [ ] ERC-721 NFT template with metadata, royalties
- [ ] ERC-1155 multi-token template
- [ ] Simple DEX template with swap, add/remove liquidity
- [ ] Staking pool template with rewards
- [ ] All templates pass Slither with zero critical issues
- [ ] Test coverage above 90% for each template
- [ ] Documentation for each template
- [ ] Templates integrated with HyperAgent selection
- [ ] Foundry tests pass for all templates

## Dependencies
- TASK-S1-001: Setup GitHub Monorepo

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes

