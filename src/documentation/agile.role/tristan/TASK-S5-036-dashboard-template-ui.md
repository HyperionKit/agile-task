# TASK-S5-036: Dashboard Template Selection UI

## Metadata
- Assignee: Tristan
- Role: CMFO/Frontend
- Sprint: 5 (Month 3)
- Priority: P1
- Status: BACKLOG
- Due Date: 2026-02-20
- Estimated Hours: 12h
- Actual Hours: 

## Problem
Users cannot select templates through the dashboard. Without UI:
- Must use CLI for template deployment
- No visual parameter configuration
- Network selection unclear
- Poor user experience for non-technical users

Current state: Templates only via API/CLI. No dashboard integration.

## Goal
Wire templates into the dashboard so developers can choose Metis or Hyperion, pick a template, set parameters, and trigger deploy.

## Success Metrics
- Template selection UI working
- Network picker (Metis/Hyperion) integrated
- Parameter form auto-generated
- Deploy button triggers deployment
- Real-time status feedback

## Technical Scope

Files to create:
```
frontend/app/
├── templates/
│   ├── page.tsx
│   └── components/
│       ├── template-grid.tsx
│       ├── template-card.tsx
│       ├── network-picker.tsx
│       ├── parameter-form.tsx
│       └── deploy-preview.tsx
```

Dependencies:
- @tanstack/react-query
- react-hook-form
- zod

## Minimal Code

```typescript
// frontend/app/templates/page.tsx
"use client";

import { useState } from "react";
import { TemplateGrid } from "./components/template-grid";
import { NetworkPicker } from "./components/network-picker";
import { ParameterForm } from "./components/parameter-form";
import { DeployPreview } from "./components/deploy-preview";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";

type Step = "select" | "network" | "params" | "review" | "deploying";

interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  networks: string[];
  parameters: Record<string, any>;
  icon: string;
}

export default function TemplatesPage() {
  const [step, setStep] = useState<Step>("select");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateConfig | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [params, setParams] = useState<Record<string, any>>({});
  
  const { data: templates } = useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const res = await fetch("/api/v1/templates");
      return res.json();
    },
  });
  
  const deployMutation = useMutation({
    mutationFn: async (deployRequest: any) => {
      const res = await fetch("/api/v1/builds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deployRequest),
      });
      return res.json();
    },
  });
  
  const handleDeploy = () => {
    if (!selectedTemplate || !selectedNetwork) return;
    
    setStep("deploying");
    
    deployMutation.mutate({
      prompt: `Deploy ${selectedTemplate.name} template`,
      template: selectedTemplate.id,
      chains: [getChainId(selectedNetwork)],
      options: params,
    });
  };
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <h1 className="text-3xl font-bold mb-2">Deploy Template</h1>
      <p className="text-muted-foreground mb-8">
        Choose a template, configure parameters, and deploy to Metis or Hyperion.
      </p>
      
      {/* Progress Steps */}
      <div className="flex gap-2 mb-8">
        {["select", "network", "params", "review"].map((s, i) => (
          <div
            key={s}
            className={`flex-1 h-2 rounded ${
              ["select", "network", "params", "review"].indexOf(step) >= i
                ? "bg-primary"
                : "bg-muted"
            }`}
          />
        ))}
      </div>
      
      {step === "select" && (
        <TemplateGrid
          templates={templates?.templates || []}
          onSelect={(t) => {
            setSelectedTemplate(t);
            setStep("network");
          }}
        />
      )}
      
      {step === "network" && selectedTemplate && (
        <NetworkPicker
          networks={selectedTemplate.networks}
          onSelect={(n) => {
            setSelectedNetwork(n);
            setStep("params");
          }}
          onBack={() => setStep("select")}
        />
      )}
      
      {step === "params" && selectedTemplate && (
        <ParameterForm
          parameters={selectedTemplate.parameters}
          onSubmit={(p) => {
            setParams(p);
            setStep("review");
          }}
          onBack={() => setStep("network")}
        />
      )}
      
      {step === "review" && selectedTemplate && selectedNetwork && (
        <DeployPreview
          template={selectedTemplate}
          network={selectedNetwork}
          params={params}
          onDeploy={handleDeploy}
          onBack={() => setStep("params")}
          isLoading={deployMutation.isPending}
        />
      )}
      
      {step === "deploying" && (
        <DeployingView buildId={deployMutation.data?.build_id} />
      )}
    </div>
  );
}
```

```typescript
// frontend/app/templates/components/template-grid.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TemplateGridProps {
  templates: TemplateConfig[];
  onSelect: (template: TemplateConfig) => void;
}

const TEMPLATE_ICONS: Record<string, string> = {
  vault: "🏦",
  staking: "📈",
  swap: "🔄",
  token: "🪙",
  nft: "🖼️",
};

export function TemplateGrid({ templates, onSelect }: TemplateGridProps) {
  const categories = {
    defi: templates.filter(t => ["vault", "staking", "swap"].some(k => t.id.includes(k))),
    tokens: templates.filter(t => ["erc20", "erc721"].some(k => t.id.includes(k))),
  };
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">DeFi Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {categories.defi.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onClick={() => onSelect(template)}
            />
          ))}
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Token Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {categories.tokens.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onClick={() => onSelect(template)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TemplateCard({ template, onClick }: { template: TemplateConfig; onClick: () => void }) {
  const icon = TEMPLATE_ICONS[template.id.split("-")[0]] || "📄";
  
  return (
    <Card
      className="cursor-pointer hover:border-primary transition-colors"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{icon}</span>
          <div>
            <CardTitle className="text-lg">{template.name}</CardTitle>
            <div className="flex gap-1 mt-1">
              {template.networks.map(n => (
                <Badge key={n} variant="outline" className="text-xs">
                  {n}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription>{template.description}</CardDescription>
      </CardContent>
    </Card>
  );
}
```

```typescript
// frontend/app/templates/components/network-picker.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface NetworkPickerProps {
  networks: string[];
  onSelect: (network: string) => void;
  onBack: () => void;
}

const NETWORK_INFO: Record<string, { name: string; icon: string; testnet: string }> = {
  metis: {
    name: "Metis",
    icon: "/chains/metis.svg",
    testnet: "Metis Sepolia",
  },
  hyperion: {
    name: "Hyperion",
    icon: "/chains/hyperion.svg",
    testnet: "Hyperion Testnet",
  },
  mantle: {
    name: "Mantle",
    icon: "/chains/mantle.svg",
    testnet: "Mantle Testnet",
  },
};

export function NetworkPicker({ networks, onSelect, onBack }: NetworkPickerProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Select Network</h2>
        <p className="text-muted-foreground">
          Choose where to deploy your contract. Start with testnet for testing.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {networks.map((network) => {
          const info = NETWORK_INFO[network] || { name: network, icon: "", testnet: "" };
          
          return (
            <Card
              key={network}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => onSelect(network)}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  {info.icon && (
                    <img src={info.icon} alt={info.name} className="w-12 h-12" />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold">{info.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Deploy to {info.testnet || `${info.name} Testnet`}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="mt-4">Testnet</Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <Button variant="outline" onClick={onBack}>
        Back to Templates
      </Button>
    </div>
  );
}
```

```typescript
// frontend/app/templates/components/parameter-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ParameterFormProps {
  parameters: Record<string, any>;
  onSubmit: (params: Record<string, any>) => void;
  onBack: () => void;
}

export function ParameterForm({ parameters, onSubmit, onBack }: ParameterFormProps) {
  const schema = buildSchema(parameters);
  const defaultValues = buildDefaults(parameters);
  
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configure Parameters</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {Object.entries(parameters).map(([key, config]: [string, any]) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>
                {formatLabel(key)}
                {config.required && <span className="text-destructive"> *</span>}
              </Label>
              <Input
                id={key}
                type={getInputType(config.type)}
                placeholder={config.example || config.description}
                {...form.register(key)}
              />
              {config.description && (
                <p className="text-sm text-muted-foreground">{config.description}</p>
              )}
              {form.formState.errors[key] && (
                <p className="text-sm text-destructive">
                  {form.formState.errors[key]?.message as string}
                </p>
              )}
            </div>
          ))}
          
          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button type="submit">
              Review Deployment
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function buildSchema(parameters: Record<string, any>) {
  const shape: Record<string, z.ZodType> = {};
  
  for (const [key, config] of Object.entries(parameters)) {
    let field: z.ZodType = z.string();
    
    if (config.type === "number") {
      field = z.coerce.number();
      if (config.min !== undefined) field = (field as z.ZodNumber).min(config.min);
      if (config.max !== undefined) field = (field as z.ZodNumber).max(config.max);
    } else if (config.type === "address") {
      field = z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid address");
    }
    
    if (!config.required) {
      field = field.optional();
    }
    
    shape[key] = field;
  }
  
  return z.object(shape);
}

function buildDefaults(parameters: Record<string, any>) {
  const defaults: Record<string, any> = {};
  
  for (const [key, config] of Object.entries(parameters)) {
    if (config.default !== undefined) {
      defaults[key] = config.default;
    }
  }
  
  return defaults;
}

function formatLabel(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .trim()
    .split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function getInputType(type: string) {
  if (type === "number") return "number";
  return "text";
}
```

## Acceptance Criteria
- [ ] Template grid displays all templates
- [ ] Templates categorized (DeFi, Tokens)
- [ ] Network picker shows supported networks
- [ ] Parameter form auto-generated from config
- [ ] Form validation with Zod
- [ ] Deploy preview shows summary
- [ ] Safety warnings displayed
- [ ] Deploy triggers API call
- [ ] Loading state during deployment
- [ ] Success redirects to build status
- [ ] Error handling with clear messages
- [ ] Mobile responsive
- [ ] Keyboard navigation

## Dependencies
- TASK-S3-027: Dashboard Implementation
- TASK-S5-033: DeFi Templates

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes
Month 3 Hyperion Milestone - Dashboard Integration

