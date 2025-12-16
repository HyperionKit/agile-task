# TASK-M3-070: ERC1066 + x402 Architecture & Gateway Service

## Metadata
- Assignee: Aaron
- Role: CTO/Project Architect
- Month: 3 (December 2025)
- Priority: P0
- Status: BACKLOG
- Due Date: 2025-12-27
- Estimated Hours: 18h
- Actual Hours: 

## Problem
- What specific issue does this task solve?
  - HyperKit needs a clear, consistent transaction and intent semantics layer that connects onchain status codes, internal domain codes, and HTTP/x402 responses.
  - Without a defined architecture, each service implements its own mapping and policy checks, which leads to bugs and inconsistent behavior across chains and products.

- What is the current state?
  - The ERC1066 + x402 reference describes the desired framework conceptually, but there is no concrete system design or backend gateway implementation in the repo.
  - There is no single source of truth for how onchain status maps to HTTP/x402, or where policies and limits are enforced.

- What pain point does it address?
  - Fragmented error handling and policy enforcement.
  - Hard to reason about how intents move from agents to contracts to external services.
  - Hard to reuse the same semantics across multiple products and chains.

## Goal
- What is the desired outcome?
  - A backend architecture and gateway service design that implements the ERC1066 + x402 semantics layer across HyperKit.

- What does success look like?
  - Clear architecture document for the gateway.
  - Minimal gateway service skeleton in the repo with placeholders for status mapping, policy engine, and x402 client.
  - Other teams can reference this design when building AA flows, DEX integrators, and external API paywalls.

- How does it contribute to MVP?
  - Provides the core backbone for intent validation and payment orchestration that other HyperAgent and AA features depend on.

## Success Metrics
- Architecture:
  - Gateway architecture document covers components, data flow, and failure modes for:
    - status mapper
    - policy engine
    - x402 client
    - RPC adapter
  - At least one sequence diagram from client to gateway to contracts to external service.

- Implementation:
  - A `gateway` service or package exists in the monorepo and builds successfully.
  - Basic HTTP/x402 endpoint stub that accepts an intent and returns a structured response object with status and policy metadata.

- Quality benchmarks:
  - Design reviewed by Justine and Tristan with comments addressed.
  - No open P0 issues on core data flow.

## Technical Scope
- Files/components to create or modify
  - Create `spec/status-codes.md` and `spec/http-mapping.md` placeholders or stubs aligned with the ERC1066 + x402 reference.
  - Create `gateway/README.md` describing the service purpose and component breakdown.
  - Create `gateway/server` skeleton (FastAPI or Node/Nest/Fastify, aligned with chosen stack).
  - Define interfaces for:
    - `StatusMapper`
    - `PolicyEngine`
    - `X402Client`
    - `RPCProviderAdapter`

- Dependencies required
  - ERC1066 + x402 reference document in `src/documentation/reference/ERC1066 + x402.md`.
  - Existing backend stack decisions (FastAPI vs Node) and RPC provider setup.

- Integration points
  - Smart contracts that expose `canExecute` or similar validation functions.
  - x402 facilitator or Coinbase client implementations.
  - HyperAgent orchestration layer that will call into the gateway.

## Minimal Code
### Gateway service skeleton (pseudo TypeScript)

```ts
// gateway/server/index.ts
import { createServer } from "./server";

async function main() {
  const app = await createServer();
  const port = process.env.PORT || 8080;
  app.listen(port, () => {
    console.log(`ERC1066 + x402 gateway listening on ${port}`);
  });
}

main().catch((err) => {
  console.error("Gateway startup failed", err);
  process.exit(1);
});
```

```ts
// gateway/server/server.ts
import express from "express";
import { StatusMapper } from "../mappers/status-mapper";
import { PolicyEngine } from "../policies/policy-engine";
import { X402Client } from "../integrations/x402-client";

export async function createServer() {
  const app = express();
  app.use(express.json());

  const statusMapper = new StatusMapper();
  const policyEngine = new PolicyEngine();
  const x402Client = new X402Client();

  app.post("/intent", async (req, res) => {
    const intent = req.body;
    // 1. Validate intent with onchain contracts
    // 2. Map ERC1066 status to internal + HTTP/x402 status
    // 3. Evaluate policies (limits, chains, contracts)
    // 4. Call x402 facilitator if allowed
    // 5. Return normalized response

    return res.json({
      status: "TODO",
      erc1066: "0x00",
      policy: { allowed: false },
      details: "Not implemented yet",
    });
  });

  return app;
}
```

## Acceptance Criteria
- Architecture and design:
  - ERC1066 + x402 high level architecture updated or confirmed and referenced from a new `gateway/README.md`.
  - Clear description of how the three layers in the reference map to code:
    - contracts
    - gateway
    - clients/SDKs

- Implementation:
  - `gateway` service compiles and runs locally with `npm` or `pnpm` scripts.
  - `/intent` endpoint responds with a structured placeholder response.

- Review checklist
  - [ ] Design reviewed with Justine (semantics, policies).
  - [ ] Design reviewed with Tristan (client and SDK needs).
  - [ ] Scripts or documentation added so others can run the gateway locally.

## Dependencies
- Blocking tasks
  - None hard-blocking, but recommended:
    - Contract-level ERC1066 status codes and `canExecute` interface defined.

- External dependencies
  - Final choice of HTTP server stack and x402 facilitator API details.

- Team coordination needs
  - Align with Justine on onchain semantics and policy schema.
  - Align with Tristan on SDK and client expectations from the gateway.

## Progress Log
- 2025-12-xx: Task created from ERC1066 + x402 reference. Initial scope and skeleton defined.


