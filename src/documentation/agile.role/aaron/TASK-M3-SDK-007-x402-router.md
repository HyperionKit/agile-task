# TASK-M3-SDK-007: x402 Multi-Network Routing

## Metadata
- Assignee: Aaron
- Role: CTO/Project Architect
- Month: 3 (December 2025)
- Priority: P0
- Status: BACKLOG
- Due Date: 2025-12-20
- Estimated Hours: 10h
- Actual Hours: 

## Problem
x402 payment routing not implemented. Without routing:
- No payment processing
- Monetization impossible
- Missing revenue stream
- Platform incomplete

Current state: x402 routing not implemented.

## Goal
Implement x402 multi-network routing: Thirdweb x402, LazAI settlement, Socket payment, direct transfer. All 4 facilitators implemented with payment intents created successfully.

## Success Metrics
- All 4 facilitators implemented
- Payment intents created successfully
- Expiration handling working
- Tested on each network
- Documentation complete

## Technical Scope

Files to create/modify:
```
packages/
├── sdk/
│   └── src/
│       └── payments/
│           ├── x402-router.ts
│           ├── thirdweb-x402.ts
│           ├── lazai-settlement.ts
│           └── socket-payment.ts
```

Dependencies:
- Thirdweb x402 API
- LazAI API
- Socket API

## Minimal Code

```typescript
// packages/sdk/src/payments/x402-router.ts
export class X402Router {
  constructor(private registry: NetworkRegistry) {}

  async routePayment(
    amount: bigint,
    targetChain: string,
    action: "agent_run" | "deployment" | "audit"
  ): Promise<PaymentIntent> {
    const config = this.registry.getConfig(targetChain);

    switch (config.payment.facilitator) {
      case "thirdweb_x402":
        return await this.thirdwebX402(amount, targetChain, action);
      case "lazai":
        return await this.lazaiSettlement(amount, targetChain, action);
      case "socket":
        return await this.socketPayment(amount, targetChain, action);
      case "direct":
        return await this.directTransfer(amount, targetChain, action);
      default:
        throw new Error(`Unknown facilitator: ${config.payment.facilitator}`);
    }
  }

  private async thirdwebX402(
    amount: bigint,
    chain: string,
    action: string
  ): Promise<PaymentIntent> {
    const x402 = new Thirdweb_x402({
      apiKey: process.env.THIRDWEB_API_KEY
    });

    const intent = await x402.createPaymentIntent({
      amount: amount.toString(),
      currency: "USDC",
      description: action,
      webhookUrl: `${WEBHOOK_URL}/x402/${chain}`
    });

    return {
      id: intent.id,
      amount,
      chain,
      facilitator: "thirdweb_x402",
      paymentUrl: intent.url,
      expiresAt: Date.now() + 3600000
    };
  }

  private async lazaiSettlement(
    amount: bigint,
    chain: string,
    action: string
  ): Promise<PaymentIntent> {
    const lazai = new LazAI({
      apiKey: process.env.LAZAI_API_KEY
    });

    const settlement = await lazai.createSettlement({
      amount: ethers.formatUnits(amount, 6),
      chain: chain === "metis" ? "metis_mainnet" : "hyperion",
      action
    });

    return {
      id: settlement.id,
      amount,
      chain,
      facilitator: "lazai",
      txHash: settlement.txHash,
      expiresAt: Date.now() + 7200000
    };
  }
}
```

## Acceptance Criteria
- [ ] All 4 facilitators implemented
- [ ] Payment intents created successfully
- [ ] Expiration handling
- [ ] Tested on each network
- [ ] Documentation complete

## Dependencies
- TASK-M3-SDK-001: Network Registry

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes

