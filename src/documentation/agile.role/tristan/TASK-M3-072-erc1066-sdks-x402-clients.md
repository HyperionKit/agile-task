# TASK-M3-072: ERC1066 + x402 Client SDKs & UX Integration

## Metadata
- Assignee: Tristan
- Role: CMFO/Frontend & Developer Experience
- Month: 3 (December 2025)
- Priority: P1
- Status: BACKLOG
- Due Date: 2025-12-30
- Estimated Hours: 20h
- Actual Hours: 

## Problem
- What specific issue does this task solve?
  - HyperKit needs client libraries and UI patterns that understand the ERC1066 + x402 semantics without exposing low level details to users.
  - Today, frontends, agents, and external services do not have a consistent way to read status codes, policies, and x402 headers from the gateway.

- What is the current state?
  - The ERC1066 + x402 reference document describes the three-layer model and the role of SDKs but there are no concrete client libraries in the repo.
  - Frontend and agent integration is ad hoc and not standardized.

- What pain point does it address?
  - Repeated effort to interpret responses and display status to users.
  - Inconsistent UX around "pending", "blocked by policy", "limit exceeded", or "requires payment".

## Goal
- What is the desired outcome?
  - A first version of the ERC1066 + x402 client SDKs and basic UI patterns used by the dashboard and build flows.

- What does success look like?
  - JavaScript/TypeScript SDK that wraps gateway calls, interprets ERC1066 codes, and exposes a simple typed result.
  - Example React components or hooks that display status and policy hints in a clean and consistent way.
  - Reference examples that other teams can copy for AA flows, DeFi templates, and external API paywalls.

- How does it contribute to MVP?
  - Makes the semantics framework visible and usable for end users and integrators.
  - Reduces integration friction for early adopters and partners.

## Success Metrics
- SDKs:
  - `sdks/js` package scaffolding created with a minimal API for:
    - sending intents to the gateway
    - parsing status and policy metadata
    - exposing helpers like `isSuccess`, `isRetryable`, `requiresPayment`
  - Basic unit tests for parsing logic and mapping of common ERC1066 codes.

- UI:
  - Example components or hooks in the frontend:
    - `<IntentStatusBadge />`
    - `<PolicyWarning />`
  - One example flow wired end to end using the SDK and components.

## Technical Scope
- Files/components to create or modify
  - `sdks/js/`:
    - `src/client.ts` for calling the gateway HTTP/x402 endpoints.
    - `src/status.ts` for mapping ERC1066 + internal codes to enums and helpers.
    - `src/types.ts` for typed responses and policy representations.
  - Frontend app:
    - A small demo page or story that shows how an intent travels through the system and how status is surfaced.

- Dependencies required
  - ERC1066 + x402 reference and gateway API shape from Aaron.
  - Status codes and policy schema definitions from Justine.

- Integration points
  - Dashboard and build flows that fetch status for builds, deployments, and external calls.
  - Any AA or DeFi templates that call through the gateway.

## Minimal Code
### JS SDK sketch

```ts
// sdks/js/src/client.ts
export interface GatewayClientOptions {
  baseUrl: string;
}

export class GatewayClient {
  private baseUrl: string;

  constructor(options: GatewayClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
  }

  async sendIntent(intent: unknown) {
    const res = await fetch(`${this.baseUrl}/intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(intent),
    });

    const data = await res.json();
    return data;
  }
}
```

### React status badge sketch

```tsx
// frontend/components/IntentStatusBadge.tsx
type IntentStatusProps = {
  status: string;
};

export function IntentStatusBadge({ status }: IntentStatusProps) {
  if (status === "SUCCESS") return <span className="badge badge-success">Success</span>;
  if (status === "RETRYABLE") return <span className="badge badge-warning">Retryable</span>;
  if (status === "BLOCKED") return <span className="badge badge-error">Blocked</span>;
  return <span className="badge">Unknown</span>;
}
```

## Acceptance Criteria
- SDK:
  - JS SDK builds and publishes locally.
  - README explains how to install and call the gateway.

- UI:
  - Example page in the dashboard that uses the SDK and badge component to show one intent lifecycle.

- Review checklist
  - [ ] API surface reviewed with Aaron to match gateway behavior.
  - [ ] Status and policy semantics reviewed with Justine.
  - [ ] UX copy and states reviewed for clarity and user friendliness.

## Dependencies
- Blocking tasks
  - Basic gateway API definition from Aaron.
  - Status code and policy schema from Justine.

- External dependencies
  - None beyond existing frontend and TypeScript toolchain.

- Team coordination needs
  - Agree on naming and messaging for common user facing states.

## Progress Log
- 2025-12-xx: Task created to align SDKs and UX with the ERC1066 + x402 semantics framework.


