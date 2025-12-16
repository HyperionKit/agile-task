# TASK-M3-071: ERC1066 + x402 Onchain Semantics & Policy Schema

## Metadata
- Assignee: Justine
- Role: CPOO/Project Architect
- Month: 3 (December 2025)
- Priority: P0
- Status: IN_PROGRESS
- Due Date: 2025-12-27
- Estimated Hours: 16h
- Actual Hours: 

## Problem
- What specific issue does this task solve?
  - HyperKit needs a consistent onchain representation of status codes and policies that align with the ERC1066 + x402 framework.
  - Without a standard schema, each contract defines its own error semantics and policy format, which makes cross-chain orchestration and gateway mapping fragile.

- What is the current state?
  - The ERC1066 + x402 reference document explains the target behavior in prose.
  - There is no shared `StatusCodes.sol`, `IntentValidator.sol`, or policy schema that other contracts can import and reuse.

- What pain point does it address?
  - Inconsistent status codes and error handling across contracts.
  - No single, versioned policy schema to describe permissions, limits, chains, and allowed contracts.

## Goal
- What is the desired outcome?
  - A minimal but complete onchain semantics layer:
    - standardized ERC1066-style status codes used by HyperKit contracts
    - a base `IntentValidator` interface
    - a clear JSON/ABI schema for policies and session rules

- What does success look like?
  - Contracts across HyperKit share a single status code library and validator interface.
  - Policy objects used by the gateway and off-chain orchestration match the onchain schema.

- How does it contribute to MVP?
  - Reduces risk in intent routing and payment decisions.
  - Makes it easier to add new templates and protocols without reinventing semantics.

## Success Metrics
- Semantics:
  - A documented subset of ERC1066 status codes in `spec/status-codes.md`.
  - A Solidity library or enum type with those codes in `StatusCodes.sol`.

- Contracts:
  - A base `IntentValidator` interface in Solidity that includes a `canExecute(bytes intent)` style function that returns an ERC1066 status code.
  - At least one example validator contract implemented for a DEX or AA use case.

- Policy schema:
  - A documented schema in `spec/policy-schema.md` with fields for:
    - allowed chains
    - allowed contracts
    - spend limits
    - time bounds
    - tags or policy IDs

## Technical Scope
- Files/components to create or modify
  - `spec/status-codes.md`:
    - subset of ERC1066 codes, their hex values, and meanings in HyperKit.
  - `spec/policy-schema.md`:
    - high level JSON examples and field descriptions.
  - `contracts/StatusCodes.sol`:
    - library or enum of status codes with clear names.
  - `contracts/IntentValidator.sol`:
    - interface or abstract contract for `canExecute` and related hooks.
  - `contracts/examples/`:
    - one or two small example validators wiring status codes and policies together.

- Dependencies required
  - ERC1066 + x402 reference document.
  - Solidity version used across the project and existing contract tooling (Foundry).

- Integration points
  - HyperAgent templates that invoke contract validation.
  - Gateway that maps onchain status to HTTP/x402 codes.
  - Account abstraction / session key logic that relies on policy IDs.

## Minimal Code
### Status codes library (sketch)

```solidity
// contracts/StatusCodes.sol
// Subset of ERC-1066 style codes for HyperKit
pragma solidity ^0.8.24;

library StatusCodes {
    bytes1 internal constant SUCCESS = 0x11;
    bytes1 internal constant TEMPORARY_FAILURE = 0x21;
    bytes1 internal constant PERMANENT_FAILURE = 0x31;
    bytes1 internal constant UNAUTHORIZED = 0x51;
    bytes1 internal constant LIMIT_EXCEEDED = 0x52;
}
```

### Intent validator interface (sketch)

```solidity
// contracts/IntentValidator.sol
pragma solidity ^0.8.24;

interface IntentValidator {
    function canExecute(bytes calldata intent) external view returns (bytes1 status);
}
```

## Acceptance Criteria
- Documentation:
  - `status-codes.md` and `policy-schema.md` explain how the onchain layer fits the three-layer model in the reference document.

- Solidity:
  - `StatusCodes.sol` and `IntentValidator.sol` compile with the current toolchain.
  - Example validator contract compiles and is covered by a minimal Foundry test.

- Review checklist
  - [ ] Status codes and meanings reviewed with Aaron for gateway compatibility.
  - [ ] Policy schema reviewed with Tristan for SDK and client usage.
  - [ ] Task linked from ERC1066 + x402 reference so the relationship is clear.

## Dependencies
- Blocking tasks
  - None, but better once basic gateway architecture is agreed so schemas align.

- External dependencies
  - None, uses existing Solidity toolchain and project layout.

- Team coordination needs
  - Align with Aaron on which ERC1066 codes are in scope.
  - Align with Tristan on what policy metadata the frontend and SDKs will surface.

## Progress Log
- 2025-12-xx: Task created to formalize onchain semantics and policy schema from the ERC1066 + x402 reference.


