# TASK-S4-030: Documentation (API + Quickstart)

## Metadata
- Assignee: Justine
- Role: CPOO/Product Lead
- Sprint: 4
- Priority: P1
- Status: BACKLOG
- Due Date: 2026-01-28
- Estimated Hours: 12h
- Actual Hours: 

## Problem
Users cannot learn the platform without documentation. Without docs:
- High support requests
- Slow onboarding
- Poor developer experience
- Low adoption

Current state: No public documentation. Internal notes only.

## Goal
Create comprehensive API documentation and quickstart guide. Enable self-service onboarding.

## Success Metrics
- OpenAPI spec complete
- Quickstart under 5 minutes
- All endpoints documented
- Code examples in 3 languages
- Zero critical gaps

## Technical Scope

Files to create:
```
docs/
├── api/
│   ├── openapi.yaml
│   ├── builds.md
│   ├── users.md
│   └── authentication.md
├── guides/
│   ├── quickstart.md
│   ├── templates.md
│   ├── multi-chain.md
│   └── troubleshooting.md
└── examples/
    ├── python/
    ├── javascript/
    └── curl/
```

Dependencies:
- redoc
- swagger-ui
- mintlify (optional)

## Minimal Code

```yaml
# docs/api/openapi.yaml
openapi: 3.1.0
info:
  title: HyperKit API
  description: |
    HyperKit API enables developers to create, audit, and deploy smart contracts
    using AI. Build production-grade dApps in minutes.
    
    ## Authentication
    All API requests require authentication via Bearer token.
    
    ## Rate Limits
    - Free tier: 100 requests/hour
    - Premium: 1000 requests/hour
    - Enterprise: Unlimited
    
    ## Errors
    All errors return JSON with `detail` and optional `code` fields.
  version: 1.0.0
  contact:
    email: api@hyperkit.io
    url: https://hyperkit.io/support
  license:
    name: Proprietary
    url: https://hyperkit.io/terms

servers:
  - url: https://api.hyperkit.io/v1
    description: Production
  - url: https://staging-api.hyperkit.io/v1
    description: Staging
  - url: http://localhost:8000/api/v1
    description: Local development

security:
  - bearerAuth: []

paths:
  /builds:
    post:
      summary: Create a new build
      description: |
        Initiates a new smart contract build. The build pipeline:
        1. Generates code using AI
        2. Runs security audit
        3. Deploys to target chains
        
        Returns immediately with `build_id`. Use WebSocket or polling
        to track progress.
      operationId: createBuild
      tags:
        - Builds
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/BuildRequest'
            examples:
              erc20:
                summary: Simple ERC-20 token
                value:
                  prompt: "Create an ERC-20 token called HyperToken with 1 billion supply"
                  chains: [5001]
                  template: erc20
              nft:
                summary: NFT collection
                value:
                  prompt: "Create NFT collection with 10k max supply, 0.1 ETH mint"
                  chains: [5001, 11155111]
                  template: erc721
      responses:
        '200':
          description: Build created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/BuildResponse'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '429':
          $ref: '#/components/responses/RateLimited'
    
    get:
      summary: List builds
      description: Returns paginated list of user's builds
      operationId: listBuilds
      tags:
        - Builds
      parameters:
        - name: status
          in: query
          schema:
            $ref: '#/components/schemas/BuildStatus'
        - name: page
          in: query
          schema:
            type: integer
            default: 1
            minimum: 1
        - name: page_size
          in: query
          schema:
            type: integer
            default: 20
            minimum: 1
            maximum: 100
      responses:
        '200':
          description: List of builds
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/BuildList'

  /builds/{build_id}:
    get:
      summary: Get build details
      operationId: getBuild
      tags:
        - Builds
      parameters:
        - name: build_id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Build details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/BuildDetail'
        '404':
          $ref: '#/components/responses/NotFound'

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  
  schemas:
    BuildRequest:
      type: object
      required:
        - prompt
        - chains
      properties:
        prompt:
          type: string
          minLength: 10
          maxLength: 2000
          description: Natural language description of the smart contract
        chains:
          type: array
          items:
            type: integer
          minItems: 1
          maxItems: 10
          description: Chain IDs to deploy to
        template:
          type: string
          enum: [erc20, erc721, vault, amm, staking]
          description: Optional template to use
        options:
          type: object
          description: Template-specific options
    
    BuildResponse:
      type: object
      properties:
        build_id:
          type: string
          format: uuid
        status:
          $ref: '#/components/schemas/BuildStatus'
        created_at:
          type: string
          format: date-time
        estimated_time:
          type: integer
          description: Estimated completion time in seconds
    
    BuildStatus:
      type: string
      enum:
        - pending
        - generating
        - auditing
        - deploying
        - complete
        - failed
        - cancelled
    
    BuildDetail:
      allOf:
        - $ref: '#/components/schemas/BuildResponse'
        - type: object
          properties:
            prompt:
              type: string
            chains:
              type: array
              items:
                $ref: '#/components/schemas/ChainTarget'
            code:
              type: string
              description: Generated Solidity code
            audit_report:
              $ref: '#/components/schemas/AuditReport'
            deployments:
              type: array
              items:
                $ref: '#/components/schemas/Deployment'
    
    AuditReport:
      type: object
      properties:
        passed:
          type: boolean
        findings:
          type: array
          items:
            $ref: '#/components/schemas/AuditFinding'
        summary:
          type: object
          properties:
            critical:
              type: integer
            high:
              type: integer
            medium:
              type: integer
            low:
              type: integer
    
    Deployment:
      type: object
      properties:
        chain_id:
          type: integer
        chain_name:
          type: string
        contract_address:
          type: string
        tx_hash:
          type: string
        verified:
          type: boolean
        verification_url:
          type: string

  responses:
    BadRequest:
      description: Invalid request
      content:
        application/json:
          schema:
            type: object
            properties:
              detail:
                type: string
    
    Unauthorized:
      description: Authentication required
      content:
        application/json:
          schema:
            type: object
            properties:
              detail:
                type: string
    
    NotFound:
      description: Resource not found
    
    RateLimited:
      description: Rate limit exceeded
      headers:
        Retry-After:
          schema:
            type: integer
```

```markdown
# docs/guides/quickstart.md

# HyperKit Quickstart Guide

Build and deploy your first smart contract in under 5 minutes.

## Prerequisites

- API key from [dashboard.hyperkit.io](https://dashboard.hyperkit.io)
- Wallet with testnet tokens (Mantle testnet recommended)

## Step 1: Get Your API Key

1. Sign in at [dashboard.hyperkit.io](https://dashboard.hyperkit.io)
2. Navigate to Settings > API Keys
3. Click "Create API Key"
4. Copy your key (shown only once)

## Step 2: Create Your First Build

### Using cURL

```bash
curl -X POST https://api.hyperkit.io/v1/builds \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create an ERC-20 token called MyToken with 1 million supply",
    "chains": [5001]
  }'
```

### Using Python

```python
import requests

response = requests.post(
    "https://api.hyperkit.io/v1/builds",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    json={
        "prompt": "Create an ERC-20 token called MyToken with 1 million supply",
        "chains": [5001]
    }
)

build_id = response.json()["build_id"]
print(f"Build started: {build_id}")
```

### Using JavaScript

```javascript
const response = await fetch("https://api.hyperkit.io/v1/builds", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    prompt: "Create an ERC-20 token called MyToken with 1 million supply",
    chains: [5001]
  })
});

const { build_id } = await response.json();
console.log(`Build started: ${build_id}`);
```

## Step 3: Check Build Status

Builds typically complete in 60-90 seconds.

```bash
curl https://api.hyperkit.io/v1/builds/{build_id} \
  -H "Authorization: Bearer YOUR_API_KEY"
```

Response when complete:

```json
{
  "build_id": "abc123",
  "status": "complete",
  "code": "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.24;...",
  "audit_report": {
    "passed": true,
    "findings": []
  },
  "deployments": [
    {
      "chain_id": 5001,
      "chain_name": "Mantle Testnet",
      "contract_address": "0x1234...5678",
      "verified": true
    }
  ]
}
```

## Step 4: Interact with Your Contract

Your contract is deployed and verified. Use the contract address to:

1. View on [Mantle Explorer](https://explorer.testnet.mantle.xyz)
2. Interact via ethers.js or web3.py
3. Import into your dApp

## Next Steps

- [Template Guide](./templates.md): Use pre-built templates
- [Multi-Chain Deployment](./multi-chain.md): Deploy to multiple chains
- [API Reference](/api): Full API documentation

## Common Issues

### Build fails with "prompt too vague"

Add more detail to your prompt. Include:
- Token name and symbol
- Supply amount
- Specific features (mintable, burnable, etc.)

### Deployment fails

Check:
1. Chain ID is correct
2. You have testnet tokens for gas
3. Contract size is within limits

Need help? Join our [Discord](https://discord.gg/hyperkit) or email support@hyperkit.io.
```

## Acceptance Criteria
- [ ] OpenAPI 3.1 spec complete
- [ ] All endpoints documented
- [ ] Request/response examples
- [ ] Error codes documented
- [ ] Rate limits documented
- [ ] Authentication guide
- [ ] Quickstart guide (under 5 min)
- [ ] Template guide
- [ ] Multi-chain guide
- [ ] Troubleshooting guide
- [ ] cURL examples
- [ ] Python examples
- [ ] JavaScript examples
- [ ] ReDoc/Swagger UI deployed
- [ ] Search functionality
- [ ] Version selector

## Dependencies
- TASK-S3-024: API /builds Endpoint

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes


