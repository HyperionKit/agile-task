# TASK-M3-SEC-008: Human-in-Loop Dashboard

## Metadata
- Assignee: Tristan
- Role: CMFO/Frontend
- Month: 3 (December 2025)
- Priority: P2
- Status: BACKLOG
- Due Date: 2025-12-28
- Estimated Hours: 12h
- Actual Hours: 

## Problem
No human-in-loop dashboard. Without dashboard:
- High-value transactions not reviewed
- No approval workflow
- Security risks
- Missing oversight

Current state: No approval dashboard for high-value transactions.

## Goal
Implement human-in-loop dashboard for high-value transaction approvals ($1000+).

## Success Metrics
- Approval dashboard created
- High-value transactions flagged
- Approval workflow functional
- Admin notifications working
- Security improved

## Technical Scope

Files to create/modify:
```
frontend/
├── app/
│   └── admin/
│       └── approvals/
│           └── page.tsx
└── components/
    └── ApprovalQueue.tsx
```

Dependencies:
- Admin API
- Notification system

## Minimal Code

```typescript
// frontend/app/admin/approvals/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ApprovalDashboard() {
  const [pending, setPending] = useState([]);
  const HIGH_VALUE_THRESHOLD = 1000; // USD
  
  useEffect(() => {
    fetchPendingApprovals();
  }, []);
  
  const fetchPendingApprovals = async () => {
    const res = await fetch('/api/admin/approvals');
    const data = await res.json();
    setPending(data.filter(tx => tx.usd_value >= HIGH_VALUE_THRESHOLD));
  };
  
  const approveTransaction = async (txHash: string) => {
    await fetch(`/api/admin/approvals/${txHash}/approve`, {
      method: 'POST'
    });
    fetchPendingApprovals();
  };
  
  const rejectTransaction = async (txHash: string) => {
    await fetch(`/api/admin/approvals/${txHash}/reject`, {
      method: 'POST'
    });
    fetchPendingApprovals();
  };
  
  return (
    <div className="p-8">
      <h1>High-Value Transaction Approvals</h1>
      {pending.map(tx => (
        <Card key={tx.hash}>
          <CardHeader>
            <CardTitle>Transaction: {tx.hash.slice(0, 8)}...</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Value: ${tx.usd_value}</p>
            <p>User: {tx.user_id}</p>
            <div className="flex gap-2">
              <Button onClick={() => approveTransaction(tx.hash)}>
                Approve
              </Button>
              <Button onClick={() => rejectTransaction(tx.hash)}>
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

## Acceptance Criteria
- [ ] Approval dashboard created
- [ ] High-value transactions flagged
- [ ] Approval workflow functional
- [ ] Admin notifications working
- [ ] Security improved

## Dependencies
- TASK-M1-OVERDUE-006: First-Stage Dashboard

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes

