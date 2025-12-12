# TASK-S1-009: API Design Specification

## Metadata
- Assignee: Justine
- Role: CPOO/Product Lead
- Sprint: 1
- Priority: P1
- Status: BACKLOG
- Due Date: 2025-12-22
- Estimated Hours: 8h
- Actual Hours: 

## Problem
Without API specification:
- Frontend and backend teams work with different assumptions
- No contract for integration
- Inconsistent error handling
- Authentication flow undefined
- Rate limiting rules unclear

Current state: No API documentation. Backend endpoints undefined.

## Goal
Create OpenAPI 3.0 specification for HyperKit API. This provides:
- Single source of truth for all endpoints
- Auto-generated client SDKs
- Interactive API documentation
- Contract between frontend and backend

## Success Metrics
- OpenAPI spec validates without errors
- All MVP endpoints defined
- Authentication flow documented
- Error responses standardized
- Rate limiting rules specified
- Frontend team approves spec

## Technical Scope

Files to create:
```
backend/
├── api/
│   ├── openapi.yaml
│   └── schemas/
│       ├── build.yaml
│       ├── user.yaml
│       ├── deploy.yaml
│       └── audit.yaml
docs/
├── api/
│   ├── authentication.md
│   ├── rate-limiting.md
│   └── errors.md
```

Dependencies:
- OpenAPI 3.0
- JSON Schema

Integration points:
- Frontend application
- External integrations
- CLI tool (future)

## Minimal Code

```yaml
# openapi.yaml
openapi: 3.0.3
info:
  title: HyperKit API
  version: 1.0.0
  description: AI-native dApp builder API

servers:
  - url: https://api.hyperkit.dev/v1
    description: Production
  - url: https://api-staging.hyperkit.dev/v1
    description: Staging

security:
  - BearerAuth: []

paths:
  /builds:
    post:
      summary: Create new build
      operationId: createBuild
      tags: [Builds]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/BuildRequest'
      responses:
        '201':
          description: Build created
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
      summary: List user builds
      operationId: listBuilds
      tags: [Builds]
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
            maximum: 100
        - name: status
          in: query
          schema:
            type: string
            enum: [pending, generating, auditing, deploying, complete, failed]
      responses:
        '200':
          description: List of builds
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/BuildList'

  /builds/{buildId}:
    get:
      summary: Get build details
      operationId: getBuild
      tags: [Builds]
      parameters:
        - name: buildId
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
                $ref: '#/components/schemas/Build'
        '404':
          $ref: '#/components/responses/NotFound'

  /builds/{buildId}/status:
    get:
      summary: Get build status (SSE)
      operationId: getBuildStatus
      tags: [Builds]
      parameters:
        - name: buildId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Server-sent events stream
          content:
            text/event-stream:
              schema:
                $ref: '#/components/schemas/BuildStatusEvent'

  /auth/wallet:
    post:
      summary: Authenticate with wallet signature
      operationId: walletAuth
      tags: [Auth]
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/WalletAuthRequest'
      responses:
        '200':
          description: Authentication successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthResponse'

  /users/me:
    get:
      summary: Get current user profile
      operationId: getCurrentUser
      tags: [Users]
      responses:
        '200':
          description: User profile
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'

  /users/me/points:
    get:
      summary: Get user points balance
      operationId: getUserPoints
      tags: [Users]
      responses:
        '200':
          description: Points balance
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PointsBalance'

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    BuildRequest:
      type: object
      required: [prompt, chains]
      properties:
        prompt:
          type: string
          maxLength: 500
          example: "Create ERC-20 token with 1M max supply"
        chains:
          type: array
          items:
            type: string
          example: ["mantle"]
        template:
          type: string
          enum: [erc20, erc721, erc1155, dex, staking]

    BuildResponse:
      type: object
      properties:
        build_id:
          type: string
          format: uuid
        status:
          type: string
          enum: [pending, generating, auditing, deploying, complete, failed]
        estimated_time:
          type: integer
          description: Estimated seconds to completion

    Build:
      type: object
      properties:
        id:
          type: string
          format: uuid
        user_id:
          type: string
          format: uuid
        status:
          type: string
        prompt:
          type: string
        chains:
          type: array
          items:
            type: string
        contract_code:
          type: string
        contract_address:
          type: string
        audit_result:
          $ref: '#/components/schemas/AuditResult'
        created_at:
          type: string
          format: date-time

    AuditResult:
      type: object
      properties:
        passed:
          type: boolean
        findings:
          type: array
          items:
            $ref: '#/components/schemas/AuditFinding'

    AuditFinding:
      type: object
      properties:
        severity:
          type: string
          enum: [critical, high, medium, low, info]
        title:
          type: string
        description:
          type: string
        line:
          type: integer

    WalletAuthRequest:
      type: object
      required: [address, signature, message]
      properties:
        address:
          type: string
          example: "0x1234..."
        signature:
          type: string
        message:
          type: string

    AuthResponse:
      type: object
      properties:
        access_token:
          type: string
        expires_at:
          type: string
          format: date-time
        user:
          $ref: '#/components/schemas/User'

    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        wallet_address:
          type: string
        points:
          type: integer
        tier:
          type: string
          enum: [free, premium, enterprise]

    Error:
      type: object
      properties:
        code:
          type: string
        message:
          type: string
        details:
          type: object

  responses:
    BadRequest:
      description: Bad request
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    Unauthorized:
      description: Unauthorized
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    RateLimited:
      description: Rate limit exceeded
      headers:
        X-RateLimit-Limit:
          schema:
            type: integer
        X-RateLimit-Remaining:
          schema:
            type: integer
        X-RateLimit-Reset:
          schema:
            type: integer
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
```

## Acceptance Criteria
- [ ] OpenAPI 3.0 specification complete
- [ ] All MVP endpoints defined
- [ ] Authentication flow documented (wallet signature)
- [ ] JWT token format specified
- [ ] Error response format standardized
- [ ] Rate limiting rules specified (60 req/min)
- [ ] Request/response schemas complete
- [ ] SSE endpoint for build status
- [ ] Spec validates with no errors
- [ ] Frontend team sign-off

## Dependencies
- TASK-S1-007: Product Requirements Documentation

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes

