# TASK-M3-SEC-003: Frontend XSS Sanitization

## Metadata
- Assignee: Tristan
- Role: CMFO/Frontend
- Month: 3 (December 2025)
- Priority: P0
- Status: BACKLOG
- Due Date: 2025-12-15
- Estimated Hours: 6h
- Actual Hours: 

## Problem
Frontend XSS vulnerabilities exist. Without sanitization:
- Session keys can be stolen
- User data compromised
- Phishing attacks possible
- Platform security at risk

Current state: API responses not sanitized before display.

## Goal
Implement frontend XSS sanitization to prevent injection attacks. All user-generated content and API responses must be sanitized.

## Success Metrics
- XSS sanitization implemented
- All inputs sanitized
- Session key protection working
- Security audit passed
- No XSS vulnerabilities found

## Technical Scope

Files to create/modify:
```
frontend/
├── lib/
│   └── sanitize.ts
└── components/
    ├── BuildForm.tsx
    └── AuditReport.tsx
```

Dependencies:
- DOMPurify
- highlight.js

## Minimal Code

```typescript
// frontend/lib/sanitize.ts
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'code', 'pre'],
    ALLOWED_ATTR: []
  });
}

export function sanitizeCode(code: string, language: string): string {
  // Sanitize code before highlighting
  const sanitized = DOMPurify.sanitize(code, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
  
  // Highlight syntax safely
  return hljs.highlight(sanitized, { language }).value;
}

export function sanitizePrompt(prompt: string): string {
  // Remove script tags and event handlers
  return DOMPurify.sanitize(prompt, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
}
```

```typescript
// frontend/components/BuildForm.tsx
import { sanitizePrompt, sanitizeCode } from '@/lib/sanitize';

export function BuildForm() {
  const [prompt, setPrompt] = useState('');
  const [code, setCode] = useState('');
  
  const handleApiResponse = (response: any) => {
    // Sanitize all API responses
    const safePrompt = sanitizePrompt(response.prompt);
    const safeCode = sanitizeCode(response.code, 'solidity');
    
    setPrompt(safePrompt);
    setCode(safeCode);
  };
  
  return (
    <form>
      <textarea 
        value={prompt}
        onChange={(e) => setPrompt(sanitizePrompt(e.target.value))}
      />
      <div dangerouslySetInnerHTML={{ __html: code }} />
    </form>
  );
}
```

## Acceptance Criteria
- [ ] XSS sanitization implemented
- [ ] All inputs sanitized
- [ ] API responses sanitized
- [ ] Code highlighting safe
- [ ] Security audit passed
- [ ] No XSS vulnerabilities

## Dependencies
None

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes

