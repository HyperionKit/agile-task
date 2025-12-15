# TASK-M3-HA-009: Dashboard Implementation

## Metadata
- Assignee: Tristan
- Role: CMFO/Frontend
- Month: 3 (December 2025)
- Priority: P0
- Status: BACKLOG
- Due Date: 2025-12-20
- Estimated Hours: 10h
- Actual Hours: 

## Problem
Dashboard not implemented. Without dashboard:
- No build history
- Missing metrics display
- No real-time updates
- Poor user experience

Current state: Dashboard not built.

## Goal
Build dashboard: charts, real-time updates via WebSocket, responsive design, build history queryable.

## Success Metrics
- Dashboard loads and displays
- Real-time updates via WebSocket
- Charts render correctly
- Build history queryable
- Responsive design

## Technical Scope

Files to create/modify:
```
frontend/
├── app/
│   └── dashboard/
│       └── page.tsx
└── components/
    ├── MetricsCard.tsx
    ├── TVLChart.tsx
    └── BuildHistory.tsx
```

Dependencies:
- Next.js 14
- Recharts
- WebSocket

## Minimal Code

```typescript
// frontend/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function Dashboard() {
  const [builds, setBuilds] = useState([]);
  const [tvlData, setTVLData] = useState([]);
  const [selectedBuild, setSelectedBuild] = useState(null);

  useEffect(() => {
    // WebSocket: Real-time updates
    const ws = new WebSocket("wss://api.hyperkit/ws/dashboard");

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "build_progress") {
        setBuilds((prev) => [...prev, data.build]);
      } else if (data.type === "tvl_update") {
        setTVLData((prev) => [...prev, data.tvl]);
      }
    };

    return () => ws.close();
  }, []);

  return (
    <div className="grid grid-cols-4 gap-4 p-8">
      <Card>
        <CardHeader>
          <CardTitle>Total Builds</CardTitle>
        </CardHeader>
        <CardContent className="text-3xl font-bold">
          {builds.length}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Success Rate</CardTitle>
        </CardHeader>
        <CardContent className="text-3xl font-bold">
          {builds.filter((b) => b.status === "success").length /
            builds.length *
            100}
          %
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>TVL</CardTitle>
        </CardHeader>
        <CardContent className="text-3xl font-bold">
          ${tvlData[tvlData.length - 1]?.tvl || 0}M
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>TVL Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart data={tvlData}>
            <CartesianGrid />
            <XAxis dataKey="timestamp" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="tvl" stroke="#2180a8" />
          </LineChart>
        </CardContent>
      </Card>

      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Recent Builds</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr>
                <th>ID</th>
                <th>Prompt</th>
                <th>Chain</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {builds.map((build) => (
                <tr
                  key={build.id}
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => setSelectedBuild(build)}
                >
                  <td>{build.id.slice(0, 8)}</td>
                  <td>{build.prompt.slice(0, 50)}...</td>
                  <td>{build.chain}</td>
                  <td className={build.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                    {build.status}
                  </td>
                  <td>{build.total_time?.toFixed(1)}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Acceptance Criteria
- [ ] Dashboard loads and displays
- [ ] Real-time updates via WebSocket
- [ ] Charts render correctly
- [ ] Build history queryable
- [ ] Responsive design

## Dependencies
- TASK-M3-HA-007: Real-Time Monitoring

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes

