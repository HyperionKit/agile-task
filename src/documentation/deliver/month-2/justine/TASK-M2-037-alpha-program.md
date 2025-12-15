# TASK-M2-037: Closed Alpha Program (50 Users)

## Metadata
- Assignee: Justine
- Role: CPOO/Product Lead
- Month: 2 (November 2025)
- Priority: P1
- Status: DONE
- Due Date: 2025-11-20
- Completed Date: 2025-11-20
- Estimated Hours: 10h
- Actual Hours: 

## Problem
Cannot validate product without real users. Without alpha:
- No real-world feedback
- Bugs undiscovered
- User needs unclear
- No testimonials for launch

Current state: Internal testing only. No external users.

## Goal
Onboard 50 alpha users for closed testing. Gather feedback for product improvement before public launch.

## Success Metrics
- 50 users onboarded
- 80%+ complete first build
- NPS score above 40
- 20+ feedback submissions
- Zero critical bugs unfixed

## Technical Scope

Files to create:
```
docs/
├── alpha/
│   ├── invitation-email.md
│   ├── onboarding-guide.md
│   ├── feedback-form.md
│   └── bug-report-template.md
backend/
└── api/routes/
    └── alpha.py  # Alpha-specific endpoints
```

Alpha user sources:
- Mantle community developers
- Discord early members
- Previous project contributors
- Web3 dev Twitter followers

## Minimal Code

```markdown
# docs/alpha/invitation-email.md

Subject: You're Invited to HyperKit Alpha

---

Hi {name},

You've been selected for exclusive early access to HyperKit, the AI-powered 
platform that builds and deploys smart contracts in under 2 minutes.

**What you'll get:**
- Early access before public launch
- Direct line to the founding team
- Influence product direction
- 10,000 bonus points (future token allocation)

**What we ask:**
- Try building at least 3 contracts
- Share honest feedback (5 min survey)
- Report any bugs you encounter
- Keep details confidential until launch

**Getting Started:**

1. Create account: https://alpha.hyperkit.io/signup?code={invite_code}
2. Read quickstart: https://docs.hyperkit.io/alpha/quickstart
3. Join Discord: https://discord.gg/hyperkit-alpha

Your invite code expires in 7 days.

Questions? Reply to this email or ping us on Discord.

Let's build the future of Web3 development together.

Best,
The HyperKit Team

---

P.S. First 10 users to complete 5 builds get exclusive "Genesis Builder" NFT.
```

```markdown
# docs/alpha/onboarding-guide.md

# Alpha User Onboarding Guide

Welcome to HyperKit Alpha! This guide helps you get started.

## What is HyperKit?

HyperKit is an AI-powered platform that generates, audits, and deploys smart 
contracts. Describe what you want to build in plain English, and we handle 
the rest.

## Your First Build

### Step 1: Connect Wallet

1. Click "Connect Wallet" in the top right
2. Select MetaMask or Phantom
3. Approve the connection

### Step 2: Create a Build

1. Click "New Build" on the dashboard
2. Describe your contract:
   - Good: "Create an ERC-20 token called AlphaToken with 10M supply, 
     mintable by owner, and 2% burn on transfers"
   - Bad: "Make a token"
3. Select target chain (Mantle Testnet recommended)
4. Click "Build"

### Step 3: Watch the Magic

- Code generation: ~15 seconds
- Security audit: ~20 seconds
- Deployment: ~30 seconds

### Step 4: Verify on Explorer

Click the explorer link to see your deployed contract.

## Templates

Start with these templates for faster builds:

| Template | Use Case |
|----------|----------|
| ERC-20 | Fungible tokens |
| ERC-721 | NFT collections |
| Vault | Yield strategies |
| Staking | Token staking |

## Providing Feedback

Your feedback shapes the product. Please:

1. **Report bugs**: Discord #bugs or in-app reporter
2. **Feature requests**: Discord #ideas
3. **Weekly survey**: Link sent every Friday

## Known Limitations (Alpha)

- Only testnet deployments
- 10 builds per day limit
- Some complex prompts may fail
- Solana support coming soon

## Getting Help

- Discord: https://discord.gg/hyperkit-alpha (fastest)
- Email: alpha@hyperkit.io
- In-app chat: Bottom right corner

## Alpha Rewards

| Action | Points |
|--------|--------|
| First build | 500 |
| Complete 5 builds | 1,000 |
| Submit feedback | 200 |
| Report bug (confirmed) | 500 |
| Refer another alpha user | 1,000 |

Points convert to $HYPE tokens at launch.

---

Thank you for being an early builder. Your feedback is invaluable.
```

```python
# backend/api/routes/alpha.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta
import secrets

router = APIRouter(prefix="/api/v1/alpha", tags=["alpha"])

class InviteRequest(BaseModel):
    email: EmailStr
    name: str
    source: str  # discord, twitter, referral, etc.
    referrer_code: Optional[str] = None

class InviteResponse(BaseModel):
    invite_code: str
    expires_at: datetime
    
class FeedbackRequest(BaseModel):
    category: str  # bug, feature, general
    title: str
    description: str
    build_id: Optional[str] = None
    severity: Optional[str] = None  # critical, high, medium, low

@router.post("/invites", response_model=InviteResponse)
async def create_invite(
    request: InviteRequest,
    admin = Depends(require_admin)
):
    """Create alpha invite (admin only)"""
    
    # Check alpha capacity
    current_count = await get_alpha_user_count()
    if current_count >= 50:
        raise HTTPException(
            status_code=400,
            detail="Alpha program is full"
        )
    
    # Generate unique invite code
    invite_code = secrets.token_urlsafe(8)
    expires_at = datetime.utcnow() + timedelta(days=7)
    
    # Store invite
    await store_invite(
        code=invite_code,
        email=request.email,
        name=request.name,
        source=request.source,
        referrer=request.referrer_code,
        expires_at=expires_at
    )
    
    # Send invitation email
    await send_invite_email(
        email=request.email,
        name=request.name,
        invite_code=invite_code
    )
    
    return InviteResponse(
        invite_code=invite_code,
        expires_at=expires_at
    )

@router.post("/signup")
async def alpha_signup(
    invite_code: str,
    wallet_address: str
):
    """Sign up with alpha invite code"""
    
    # Validate invite
    invite = await get_invite(invite_code)
    
    if not invite:
        raise HTTPException(status_code=400, detail="Invalid invite code")
    
    if invite.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invite code expired")
    
    if invite.used:
        raise HTTPException(status_code=400, detail="Invite code already used")
    
    # Create alpha user
    user = await create_alpha_user(
        wallet_address=wallet_address,
        invite_code=invite_code,
        email=invite.email,
        name=invite.name
    )
    
    # Mark invite as used
    await mark_invite_used(invite_code)
    
    # Award signup points
    await award_points(user.id, 500, "alpha_signup")
    
    # Send welcome email
    await send_welcome_email(invite.email, invite.name)
    
    return {"user_id": user.id, "points": 500}

@router.post("/feedback")
async def submit_feedback(
    request: FeedbackRequest,
    user = Depends(get_current_user)
):
    """Submit alpha feedback"""
    
    # Verify alpha user
    if not user.is_alpha:
        raise HTTPException(status_code=403, detail="Alpha users only")
    
    # Store feedback
    feedback_id = await store_feedback(
        user_id=user.id,
        category=request.category,
        title=request.title,
        description=request.description,
        build_id=request.build_id,
        severity=request.severity
    )
    
    # Award points
    points = 200 if request.category != "bug" else 500
    await award_points(user.id, points, "feedback_submitted")
    
    # Notify team on Discord
    await notify_discord_feedback(
        user=user.name,
        category=request.category,
        title=request.title
    )
    
    return {
        "feedback_id": feedback_id,
        "points_awarded": points
    }

@router.get("/leaderboard")
async def get_leaderboard(
    limit: int = 10
):
    """Get alpha user leaderboard"""
    
    users = await get_top_alpha_users(limit)
    
    return {
        "leaderboard": [
            {
                "rank": i + 1,
                "name": user.name,
                "points": user.points,
                "builds": user.build_count
            }
            for i, user in enumerate(users)
        ]
    }

@router.get("/stats")
async def get_alpha_stats():
    """Get alpha program statistics"""
    
    return {
        "total_users": await get_alpha_user_count(),
        "total_builds": await get_alpha_build_count(),
        "success_rate": await get_alpha_success_rate(),
        "avg_build_time": await get_alpha_avg_build_time(),
        "feedback_count": await get_feedback_count(),
        "nps_score": await calculate_nps()
    }
```

## Acceptance Criteria
- [ ] Invite system implemented
- [ ] Invite code generation
- [ ] Invite code validation
- [ ] Alpha signup flow
- [ ] Welcome email template
- [ ] Onboarding guide written
- [ ] Feedback submission endpoint
- [ ] Bug report template
- [ ] Points reward system
- [ ] Leaderboard endpoint
- [ ] Alpha stats dashboard
- [ ] Discord notifications
- [ ] 50 invites sent
- [ ] Weekly survey setup
- [ ] NPS tracking

## Dependencies
- TASK-S4-030: Documentation
- TASK-S3-027: Dashboard Implementation

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes


