# TASK-S3-027: Dashboard Implementation

## Metadata
- Assignee: Tristan
- Role: CMFO/Frontend
- Sprint: 3
- Priority: P1
- Status: BACKLOG
- Due Date: 2026-01-20
- Estimated Hours: 14h
- Actual Hours: 

## Problem
Users need visibility into their builds and metrics. Without dashboard:
- Cannot see build history
- No deployment tracking
- Usage stats invisible
- Poor retention

Current state: No dashboard. Users cannot track their work.

## Goal
Build comprehensive dashboard with build history, deployment status, metrics, and quick actions.

## Success Metrics
- All builds visible with status
- Real-time deployment tracking
- Key metrics displayed
- Sub-second page load
- Mobile responsive

## Technical Scope

Files to create:
```
frontend/app/
├── dashboard/
│   ├── page.tsx
│   ├── layout.tsx
│   └── components/
│       ├── stats-cards.tsx
│       ├── builds-table.tsx
│       ├── deployments-list.tsx
│       ├── activity-feed.tsx
│       └── quick-actions.tsx
```

Dependencies:
- @tanstack/react-query
- @tanstack/react-table
- recharts

## Minimal Code

```typescript
// frontend/app/dashboard/page.tsx
"use client";

import { Suspense } from "react";
import { StatsCards } from "./components/stats-cards";
import { BuildsTable } from "./components/builds-table";
import { DeploymentsList } from "./components/deployments-list";
import { ActivityFeed } from "./components/activity-feed";
import { QuickActions } from "./components/quick-actions";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your dApps and track deployments
          </p>
        </div>
        <QuickActions />
      </div>
      
      {/* Stats */}
      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsCards />
      </Suspense>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Builds Table */}
        <div className="lg:col-span-2">
          <Suspense fallback={<TableSkeleton />}>
            <BuildsTable />
          </Suspense>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          <Suspense fallback={<ListSkeleton />}>
            <DeploymentsList />
          </Suspense>
          
          <Suspense fallback={<ListSkeleton />}>
            <ActivityFeed />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-32" />
      ))}
    </div>
  );
}

function TableSkeleton() {
  return <Skeleton className="h-96" />;
}

function ListSkeleton() {
  return <Skeleton className="h-64" />;
}
```

```typescript
// frontend/app/dashboard/components/stats-cards.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Stats {
  totalBuilds: number;
  buildsTrend: number;
  successRate: number;
  successTrend: number;
  deployments: number;
  deploymentsTrend: number;
  points: number;
  pointsTrend: number;
}

export function StatsCards() {
  const { data: stats } = useQuery<Stats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/v1/users/me/stats");
      return res.json();
    },
  });
  
  const cards = [
    {
      title: "Total Builds",
      value: stats?.totalBuilds ?? 0,
      trend: stats?.buildsTrend ?? 0,
      format: (v: number) => v.toString(),
    },
    {
      title: "Success Rate",
      value: stats?.successRate ?? 0,
      trend: stats?.successTrend ?? 0,
      format: (v: number) => `${v}%`,
    },
    {
      title: "Deployments",
      value: stats?.deployments ?? 0,
      trend: stats?.deploymentsTrend ?? 0,
      format: (v: number) => v.toString(),
    },
    {
      title: "Points Earned",
      value: stats?.points ?? 0,
      trend: stats?.pointsTrend ?? 0,
      format: (v: number) => v.toLocaleString(),
    },
  ];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <TrendIndicator value={card.trend} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {card.format(card.value)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {card.trend > 0 ? "+" : ""}{card.trend}% from last week
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TrendIndicator({ value }: { value: number }) {
  if (value > 0) {
    return <TrendingUp className="h-4 w-4 text-green-500" />;
  }
  if (value < 0) {
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  }
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}
```

```typescript
// frontend/app/dashboard/components/builds-table.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Download, Trash } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface Build {
  id: string;
  prompt: string;
  status: "pending" | "generating" | "auditing" | "deploying" | "complete" | "failed";
  chains: { name: string; chainId: number }[];
  createdAt: string;
  template?: string;
}

const STATUS_VARIANTS: Record<Build["status"], string> = {
  pending: "secondary",
  generating: "pending",
  auditing: "pending",
  deploying: "pending",
  complete: "success",
  failed: "destructive",
};

export function BuildsTable() {
  const [page, setPage] = useState(1);
  
  const { data, isLoading } = useQuery({
    queryKey: ["builds", page],
    queryFn: async () => {
      const res = await fetch(`/api/v1/builds?page=${page}&page_size=10`);
      return res.json();
    },
  });
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Recent Builds</CardTitle>
          <Link href="/build">
            <Button size="sm">New Build</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Prompt</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Chains</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.builds?.map((build: Build) => (
              <TableRow key={build.id}>
                <TableCell className="max-w-[300px]">
                  <div className="truncate font-medium">
                    {build.prompt.slice(0, 50)}...
                  </div>
                  {build.template && (
                    <div className="text-xs text-muted-foreground">
                      Template: {build.template}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANTS[build.status] as any}>
                    {build.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {build.chains.slice(0, 2).map((chain) => (
                      <Badge key={chain.chainId} variant="outline">
                        {chain.name}
                      </Badge>
                    ))}
                    {build.chains.length > 2 && (
                      <Badge variant="outline">
                        +{build.chains.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDistanceToNow(new Date(build.createdAt), { addSuffix: true })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/builds/${build.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="mr-2 h-4 w-4" />
                        Download Code
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {data?.builds?.length ?? 0} of {data?.total ?? 0} builds
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={!data?.builds || data.builds.length < 10}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

```typescript
// frontend/app/dashboard/components/activity-feed.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  type: "build_created" | "build_complete" | "deployment" | "points_earned";
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

const ACTIVITY_ICONS: Record<Activity["type"], string> = {
  build_created: "🔨",
  build_complete: "✅",
  deployment: "🚀",
  points_earned: "⭐",
};

export function ActivityFeed() {
  const { data: activities } = useQuery<Activity[]>({
    queryKey: ["activity-feed"],
    queryFn: async () => {
      const res = await fetch("/api/v1/users/me/activity?limit=10");
      return res.json();
    },
    refetchInterval: 30000, // Refresh every 30s
  });
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities?.map((activity) => (
            <div key={activity.id} className="flex gap-3">
              <div className="text-xl">
                {ACTIVITY_ICONS[activity.type]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">{activity.message}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
          
          {(!activities || activities.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent activity
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

## Acceptance Criteria
- [ ] Stats cards with trends
- [ ] Builds table with pagination
- [ ] Status badges color coded
- [ ] Chain badges displayed
- [ ] Deployments list
- [ ] Activity feed (real-time)
- [ ] Quick actions menu
- [ ] Build detail modal/page
- [ ] Code download action
- [ ] Delete build action
- [ ] Filter by status
- [ ] Sort by date
- [ ] Search builds
- [ ] Mobile responsive
- [ ] Sub-second initial load
- [ ] Skeleton loading states

## Dependencies
- TASK-S2-025: Design System
- TASK-S3-024: API /builds Endpoint
- TASK-S1-012: Dashboard Wireframes

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes


