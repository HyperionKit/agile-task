# TASK-M5-068: Public Beta Launch (Metis & Hyperion)

## Metadata
- Assignee: Aaron
- Role: CTO/Project Architect
- Month: 5 (February 2026)
- Priority: P0
- Status: BACKLOG
- Due Date: 2026-02-15
- Estimated Hours: 20h
- Actual Hours: 

## Problem
Platform only accessible to pilots and internal users. Without public beta:
- Cannot scale user acquisition
- No broad feedback collection
- Limited stress testing
- Missing market validation

Current state: Closed alpha with 50 users. No public access.

## Goal
Open controlled public beta for Metis and Hyperion builders through waitlist. Prepare mainnet-ready path for conservative flows.

## Success Metrics
- Public beta dashboard live
- Waitlist/invite system working
- 20-30 external builders active
- SDK/CLI release candidates tagged
- 1-2 mainnet-ready flows identified

## Technical Scope

Infrastructure:
```
systems/
├── waitlist/
│   ├── signup-page
│   ├── invite-queue
│   └── onboarding-flow
├── beta-dashboard/
│   ├── feature-flags
│   ├── usage-limits
│   └── feedback-widget
└── mainnet-prep/
    ├── conservative-flows
    └── deployment-guards
```

## Minimal Code

```typescript
// frontend/app/beta/signup/page.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function BetaSignupPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    
    await fetch("/api/v1/beta/signup", {
      method: "POST",
      body: JSON.stringify({
        email: formData.get("email"),
        wallet: formData.get("wallet"),
        network: formData.get("network"),
        project: formData.get("project"),
        experience: formData.get("experience"),
      }),
    });
    
    setSubmitted(true);
    setLoading(false);
  };
  
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>You're on the list!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We'll email you when your spot is ready. 
              In the meantime, join our Discord to connect with other builders.
            </p>
            <Button className="mt-4 w-full" asChild>
              <a href="https://discord.gg/hyperkit">Join Discord</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Join HyperKit Beta</CardTitle>
          <p className="text-muted-foreground">
            Deploy smart contracts on Metis and Hyperion in minutes.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="wallet">Wallet Address</Label>
              <Input id="wallet" name="wallet" placeholder="0x..." required />
            </div>
            
            <div className="space-y-2">
              <Label>Primary Network</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input type="radio" name="network" value="metis" defaultChecked />
                  Metis
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="network" value="hyperion" />
                  Hyperion
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="network" value="both" />
                  Both
                </label>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="project">What are you building?</Label>
              <Input 
                id="project" 
                name="project" 
                placeholder="DeFi app, NFT project, etc." 
              />
            </div>
            
            <div className="space-y-2">
              <Label>Solidity Experience</Label>
              <select 
                name="experience" 
                className="w-full p-2 border rounded"
              >
                <option value="beginner">Beginner (learning)</option>
                <option value="intermediate">Intermediate (1-2 years)</option>
                <option value="advanced">Advanced (3+ years)</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <Checkbox id="terms" name="terms" required />
              <Label htmlFor="terms" className="text-sm">
                I agree to the beta testing terms
              </Label>
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Submitting..." : "Join Waitlist"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

```python
# backend/api/routes/beta.py
from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
import secrets

router = APIRouter(prefix="/api/v1/beta", tags=["beta"])

class BetaSignup(BaseModel):
    email: EmailStr
    wallet: str
    network: str
    project: Optional[str] = None
    experience: str

class BetaInvite(BaseModel):
    email: str
    invite_code: str
    expires_at: datetime

@router.post("/signup")
async def beta_signup(
    signup: BetaSignup,
    background_tasks: BackgroundTasks
):
    """Add user to beta waitlist"""
    
    # Check if already signed up
    existing = await get_waitlist_entry(signup.email)
    if existing:
        return {"status": "already_registered", "position": existing.position}
    
    # Add to waitlist
    position = await add_to_waitlist(signup)
    
    # Send confirmation email
    background_tasks.add_task(
        send_waitlist_confirmation,
        signup.email,
        position
    )
    
    return {"status": "registered", "position": position}

@router.post("/invite")
async def create_invite(email: str, admin = Depends(require_admin)):
    """Create beta invite (admin only)"""
    
    invite_code = secrets.token_urlsafe(16)
    expires_at = datetime.utcnow() + timedelta(days=7)
    
    invite = BetaInvite(
        email=email,
        invite_code=invite_code,
        expires_at=expires_at
    )
    
    await save_invite(invite)
    await send_invite_email(email, invite_code)
    
    return {"invite_code": invite_code, "expires_at": expires_at}

@router.post("/redeem/{code}")
async def redeem_invite(code: str, wallet: str):
    """Redeem beta invite code"""
    
    invite = await get_invite(code)
    
    if not invite:
        raise HTTPException(400, "Invalid invite code")
    
    if invite.expires_at < datetime.utcnow():
        raise HTTPException(400, "Invite code expired")
    
    if invite.redeemed:
        raise HTTPException(400, "Invite already used")
    
    # Create beta user
    user = await create_beta_user(wallet, invite.email)
    
    # Mark invite as used
    await mark_invite_redeemed(code)
    
    # Set feature flags
    await set_feature_flags(user.id, {
        "beta_access": True,
        "mainnet_enabled": False,  # Testnet only for now
        "template_limit": 50,
        "builds_per_day": 20,
    })
    
    return {"user_id": user.id, "access_level": "beta"}
```

```typescript
// frontend/lib/feature-flags.ts
import { useQuery } from "@tanstack/react-query";

interface FeatureFlags {
  beta_access: boolean;
  mainnet_enabled: boolean;
  template_limit: number;
  builds_per_day: number;
  experimental_features: boolean;
}

export function useFeatureFlags() {
  return useQuery<FeatureFlags>({
    queryKey: ["feature-flags"],
    queryFn: async () => {
      const res = await fetch("/api/v1/users/me/features");
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function FeatureGate({ 
  feature, 
  children, 
  fallback 
}: { 
  feature: keyof FeatureFlags;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { data: flags } = useFeatureFlags();
  
  if (!flags || !flags[feature]) {
    return fallback || null;
  }
  
  return <>{children}</>;
}
```

```python
# backend/hyperagent/mainnet/guards.py
"""
Mainnet deployment guards for conservative flows.
Only allow well-tested, low-risk deployments on mainnet.
"""

class MainnetGuard:
    """
    Guards for mainnet deployment.
    Restricts to conservative, well-tested flows.
    """
    
    # Templates approved for mainnet
    APPROVED_TEMPLATES = [
        "erc20-basic",      # Simple token, no mint
        "erc20-burnable",   # Token with burn only
    ]
    
    # Disallowed patterns on mainnet (until audited)
    DISALLOWED_PATTERNS = [
        "upgradeable",
        "delegatecall",
        "selfdestruct",
        "assembly",
    ]
    
    # Max contract size for mainnet (conservative)
    MAX_CONTRACT_SIZE = 20000  # bytes
    
    async def can_deploy_mainnet(
        self,
        template: str,
        code: str,
        params: dict
    ) -> tuple[bool, str]:
        """Check if deployment is allowed on mainnet"""
        
        # Check template allowlist
        if template not in self.APPROVED_TEMPLATES:
            return False, f"Template '{template}' not approved for mainnet"
        
        # Check for disallowed patterns
        for pattern in self.DISALLOWED_PATTERNS:
            if pattern.lower() in code.lower():
                return False, f"Pattern '{pattern}' not allowed on mainnet"
        
        # Check contract size
        bytecode_size = len(bytes.fromhex(code[2:]))
        if bytecode_size > self.MAX_CONTRACT_SIZE:
            return False, f"Contract too large: {bytecode_size} bytes"
        
        # All checks passed
        return True, "Approved for mainnet deployment"
```

## Acceptance Criteria
- [ ] Waitlist signup page live
- [ ] Invite system working
- [ ] Beta dashboard with feature flags
- [ ] Usage limits enforced
- [ ] Feedback widget integrated
- [ ] 20-30 beta users active
- [ ] SDK release candidate tagged
- [ ] CLI release candidate tagged
- [ ] Mainnet guards implemented
- [ ] Conservative flows identified (2+)
- [ ] Migration guide from alpha
- [ ] Beta terms of service

## Dependencies
- TASK-S6-039: Deployment Pipeline Stability
- TASK-S4-031: Alpha Program

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes
Month 5 Hyperion Milestone - Public Beta

