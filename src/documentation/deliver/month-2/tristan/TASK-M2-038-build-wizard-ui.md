# TASK-M2-038: Build Wizard UI

## Metadata
- Assignee: Tristan
- Role: CMFO/Frontend
- Month: 2 (November 2025)
- Priority: P0
- Status: DONE
- Due Date: 2025-11-07
- Completed Date: 2025-11-07
- Estimated Hours: 16h
- Actual Hours: 

## Problem
Users need intuitive interface to create dApps. Without build wizard:
- No way to use the platform
- Complex prompts confuse users
- Chain selection unclear
- No progress visibility

Current state: No build interface. API exists but no frontend.

## Goal
Create step-by-step build wizard: prompt entry, chain selection, template choice, and real-time build progress.

## Success Metrics
- Complete build flow in 5 clicks
- Real-time progress updates
- Clear error messaging
- Mobile responsive
- 90%+ completion rate

## Technical Scope

Files to create:
```
frontend/app/
├── build/
│   ├── page.tsx
│   ├── components/
│   │   ├── prompt-step.tsx
│   │   ├── chain-step.tsx
│   │   ├── template-step.tsx
│   │   ├── review-step.tsx
│   │   ├── progress-view.tsx
│   │   └── result-view.tsx
│   └── hooks/
│       ├── use-build.ts
│       └── use-build-stream.ts
```

Dependencies:
- @tanstack/react-query
- zustand
- framer-motion

## Minimal Code

```typescript
// frontend/app/build/page.tsx
"use client";

import { useState } from "react";
import { PromptStep } from "./components/prompt-step";
import { ChainStep } from "./components/chain-step";
import { TemplateStep } from "./components/template-step";
import { ReviewStep } from "./components/review-step";
import { ProgressView } from "./components/progress-view";
import { ResultView } from "./components/result-view";
import { useBuild } from "./hooks/use-build";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const STEPS = ["prompt", "chains", "template", "review"] as const;
type Step = typeof STEPS[number];

export default function BuildPage() {
  const [step, setStep] = useState<Step>("prompt");
  const { buildState, startBuild, resetBuild } = useBuild();
  
  // If build is in progress or complete, show different views
  if (buildState.status === "building") {
    return <ProgressView build={buildState} />;
  }
  
  if (buildState.status === "complete") {
    return <ResultView build={buildState} onNewBuild={resetBuild} />;
  }
  
  const stepIndex = STEPS.indexOf(step);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Build Your dApp</h1>
          <p className="text-muted-foreground">
            Describe what you want to build and deploy in minutes.
          </p>
        </div>
        
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-2">
            {STEPS.map((s, i) => (
              <span
                key={s}
                className={stepIndex >= i ? "text-primary" : "text-muted-foreground"}
              >
                {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
              </span>
            ))}
          </div>
          <Progress value={progress} />
        </div>
        
        {/* Step Content */}
        <Card className="p-6">
          {step === "prompt" && (
            <PromptStep
              onNext={(prompt) => {
                buildState.prompt = prompt;
                setStep("chains");
              }}
            />
          )}
          
          {step === "chains" && (
            <ChainStep
              onNext={(chains) => {
                buildState.chains = chains;
                setStep("template");
              }}
              onBack={() => setStep("prompt")}
            />
          )}
          
          {step === "template" && (
            <TemplateStep
              prompt={buildState.prompt}
              onNext={(template) => {
                buildState.template = template;
                setStep("review");
              }}
              onBack={() => setStep("chains")}
            />
          )}
          
          {step === "review" && (
            <ReviewStep
              build={buildState}
              onSubmit={() => startBuild()}
              onBack={() => setStep("template")}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
```

```typescript
// frontend/app/build/components/prompt-step.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface PromptStepProps {
  onNext: (prompt: string) => void;
}

const EXAMPLES = [
  "Create an ERC-20 token called HyperToken with 1 billion supply and 2% burn on transfer",
  "Build an NFT collection with 10,000 items, 0.1 ETH mint price, and 5% royalties",
  "Create a yield vault that deposits into Aave and compounds rewards daily",
];

export function PromptStep({ onNext }: PromptStepProps) {
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");
  
  const handleSubmit = () => {
    if (prompt.length < 20) {
      setError("Please provide more detail about your dApp (at least 20 characters)");
      return;
    }
    onNext(prompt);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="prompt" className="text-lg font-medium">
          What do you want to build?
        </Label>
        <p className="text-sm text-muted-foreground mt-1">
          Describe your smart contract in plain English. Be specific about features.
        </p>
      </div>
      
      <Textarea
        id="prompt"
        placeholder="Create an ERC-20 token with..."
        className="min-h-[150px] text-base"
        value={prompt}
        onChange={(e) => {
          setPrompt(e.target.value);
          setError("");
        }}
      />
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      
      <div className="space-y-2">
        <p className="text-sm font-medium">Examples:</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((example, i) => (
            <button
              key={i}
              onClick={() => setPrompt(example)}
              className="text-sm text-primary hover:underline text-left"
            >
              {example.slice(0, 50)}...
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button onClick={handleSubmit} size="lg">
          Next: Select Chains
        </Button>
      </div>
    </div>
  );
}
```

```typescript
// frontend/app/build/components/chain-step.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface ChainStepProps {
  onNext: (chains: number[]) => void;
  onBack: () => void;
}

const CHAINS = [
  { id: 5001, name: "Mantle Testnet", icon: "/chains/mantle.svg", testnet: true },
  { id: 5000, name: "Mantle", icon: "/chains/mantle.svg", testnet: false },
  { id: 11155111, name: "Sepolia", icon: "/chains/ethereum.svg", testnet: true },
  { id: 1, name: "Ethereum", icon: "/chains/ethereum.svg", testnet: false },
  { id: 80001, name: "Mumbai", icon: "/chains/polygon.svg", testnet: true },
  { id: 137, name: "Polygon", icon: "/chains/polygon.svg", testnet: false },
];

export function ChainStep({ onNext, onBack }: ChainStepProps) {
  const [selected, setSelected] = useState<number[]>([5001]); // Default: Mantle testnet
  
  const toggleChain = (chainId: number) => {
    setSelected(prev =>
      prev.includes(chainId)
        ? prev.filter(id => id !== chainId)
        : [...prev, chainId]
    );
  };
  
  return (
    <div className="space-y-6">
      <div>
        <Label className="text-lg font-medium">
          Select target chains
        </Label>
        <p className="text-sm text-muted-foreground mt-1">
          Choose one or more chains to deploy your contract.
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {CHAINS.map((chain) => (
          <div
            key={chain.id}
            onClick={() => toggleChain(chain.id)}
            className={`
              flex items-center space-x-3 p-4 rounded-lg border cursor-pointer
              transition-colors
              ${selected.includes(chain.id)
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
              }
            `}
          >
            <Checkbox
              checked={selected.includes(chain.id)}
              onChange={() => toggleChain(chain.id)}
            />
            <img
              src={chain.icon}
              alt={chain.name}
              className="w-6 h-6"
            />
            <div className="flex-1">
              <p className="font-medium">{chain.name}</p>
            </div>
            {chain.testnet && (
              <Badge variant="secondary">Testnet</Badge>
            )}
          </div>
        ))}
      </div>
      
      {selected.length === 0 && (
        <p className="text-sm text-destructive">
          Select at least one chain
        </p>
      )}
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={() => onNext(selected)}
          disabled={selected.length === 0}
          size="lg"
        >
          Next: Choose Template
        </Button>
      </div>
    </div>
  );
}
```

```typescript
// frontend/app/build/components/progress-view.tsx
"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useBuildStream } from "../hooks/use-build-stream";
import { motion, AnimatePresence } from "framer-motion";

interface ProgressViewProps {
  build: {
    buildId: string;
    prompt: string;
  };
}

const STEPS = [
  { key: "generating", label: "Generating Code", icon: "code" },
  { key: "auditing", label: "Security Audit", icon: "shield" },
  { key: "deploying", label: "Deploying", icon: "rocket" },
];

export function ProgressView({ build }: ProgressViewProps) {
  const { status, progress, currentStep, logs } = useBuildStream(build.buildId);
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-3xl">
        <Card className="p-8">
          <div className="text-center mb-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 mx-auto mb-4"
            >
              <svg viewBox="0 0 24 24" className="w-full h-full text-primary">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="60 20"
                />
              </svg>
            </motion.div>
            <h2 className="text-2xl font-bold mb-2">Building Your dApp</h2>
            <p className="text-muted-foreground">{build.prompt.slice(0, 100)}...</p>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm mb-2">
              <span>{currentStep}</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
          
          {/* Steps */}
          <div className="space-y-4 mb-8">
            {STEPS.map((step, index) => {
              const stepIndex = STEPS.findIndex(s => s.key === currentStep);
              const isComplete = index < stepIndex;
              const isCurrent = step.key === currentStep;
              
              return (
                <div
                  key={step.key}
                  className={`
                    flex items-center space-x-4 p-4 rounded-lg
                    ${isCurrent ? "bg-primary/10 border border-primary" : ""}
                    ${isComplete ? "opacity-50" : ""}
                  `}
                >
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center
                    ${isComplete ? "bg-green-500 text-white" : ""}
                    ${isCurrent ? "bg-primary text-white" : "bg-muted"}
                  `}>
                    {isComplete ? "✓" : index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{step.label}</p>
                  </div>
                  {isCurrent && (
                    <Badge variant="pending">In Progress</Badge>
                  )}
                  {isComplete && (
                    <Badge variant="success">Complete</Badge>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Live Logs */}
          <div className="bg-muted rounded-lg p-4 font-mono text-sm max-h-48 overflow-y-auto">
            <AnimatePresence>
              {logs.map((log, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-muted-foreground"
                >
                  {log}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Card>
      </div>
    </div>
  );
}
```

```typescript
// frontend/app/build/hooks/use-build-stream.ts
import { useState, useEffect } from "react";

interface BuildUpdate {
  status: string;
  progress: number;
  step: string;
  message?: string;
}

export function useBuildStream(buildId: string) {
  const [status, setStatus] = useState("pending");
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("generating");
  const [logs, setLogs] = useState<string[]>([]);
  
  useEffect(() => {
    const ws = new WebSocket(
      `${process.env.NEXT_PUBLIC_WS_URL}/api/v1/builds/${buildId}/stream`
    );
    
    ws.onmessage = (event) => {
      const update: BuildUpdate = JSON.parse(event.data);
      
      setStatus(update.status);
      setProgress(update.progress);
      setCurrentStep(update.step);
      
      if (update.message) {
        setLogs(prev => [...prev.slice(-50), update.message!]);
      }
    };
    
    ws.onerror = () => {
      setLogs(prev => [...prev, "Connection error. Retrying..."]);
    };
    
    return () => ws.close();
  }, [buildId]);
  
  return { status, progress, currentStep, logs };
}
```

## Acceptance Criteria
- [ ] 4-step wizard flow working
- [ ] Prompt input with examples
- [ ] Chain multi-select UI
- [ ] Template suggestions
- [ ] Review step with summary
- [ ] Real-time progress view
- [ ] WebSocket integration
- [ ] Live log streaming
- [ ] Result view with download
- [ ] Error state handling
- [ ] Mobile responsive
- [ ] Keyboard navigation
- [ ] Loading states
- [ ] Animation polish
- [ ] 5 clicks to complete

## Dependencies
- TASK-S2-025: Design System
- TASK-S3-024: API /builds Endpoint

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes


