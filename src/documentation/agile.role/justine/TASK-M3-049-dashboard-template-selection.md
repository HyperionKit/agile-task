# TASK-M3-049: Dashboard Template Selection

## Metadata
- Assignee: Justine
- Role: CPOO/Product Lead
- Month: 3 (December 2025)
- Priority: P1
- Status: BACKLOG
- Due Date: 2025-12-20
- Estimated Hours: 8h
- Actual Hours: 

## Problem
Developers cannot select templates through dashboard. Without UI:
- Must use CLI for template deployment
- No visual template browsing
- Parameter setting unclear
- Network selection not obvious

Current state: Templates exist but only accessible via CLI.

## Goal
Wire templates into dashboard so developers can choose Metis or Hyperion, pick a template, set parameters, and trigger deploy using the same backend that HyperionKit exposes.

## Success Metrics
- Template selection UI functional
- Network selection (Metis/Hyperion) working
- Parameter form for each template
- Deploy button triggers backend
- 10+ successful deployments via dashboard

## Technical Scope

Files to create/modify:
```
frontend/
├── app/
│   └── templates/
│       ├── page.tsx
│       ├── [templateId]/
│       │   └── page.tsx
│       └── components/
│           ├── TemplateCard.tsx
│           ├── TemplateSelector.tsx
│           └── ParameterForm.tsx
```

Dependencies:
- @hyperkit/sdk
- HyperionKit npm package

## Minimal Code

```typescript
// frontend/app/templates/page.tsx
import { TemplateCard } from './components/TemplateCard';

export default function TemplatesPage() {
  const templates = [
    { id: 'vault-metis', name: 'Vault (Metis)', network: 'metis' },
    { id: 'staking-hyperion', name: 'Staking Pool (Hyperion)', network: 'hyperion' },
    { id: 'swap-multi', name: 'Simple Swap', network: 'multi' }
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {templates.map(template => (
        <TemplateCard key={template.id} template={template} />
      ))}
    </div>
  );
}
```

## Acceptance Criteria
- [ ] Template list displays all available templates
- [ ] Network filter (Metis/Hyperion) working
- [ ] Template detail page shows parameters
- [ ] Parameter form validates inputs
- [ ] Deploy button calls backend API
- [ ] Success/error states displayed
- [ ] Mobile responsive

## Dependencies
- TASK-M3-048: DeFi Templates (Metis & Hyperion)
- TASK-M3-054: Dashboard Template UI

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes

