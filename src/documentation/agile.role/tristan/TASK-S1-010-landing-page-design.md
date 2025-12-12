# TASK-S1-010: Landing Page Design

## Metadata
- Assignee: Tristan
- Role: CMFO/Frontend
- Sprint: 1
- Priority: P1
- Status: IN_PROGRESS
- Due Date: 2025-12-18
- Estimated Hours: 12h
- Actual Hours: 

## Problem
HyperKit needs a public-facing landing page to:
- Explain the product value proposition
- Convert visitors to users
- Establish brand credibility
- Provide entry point to dashboard

Without landing page:
- No way to explain product
- No conversion funnel
- Competitors capture mindshare
- Launch has no destination

Current state: No website exists. Product has no public presence.

## Goal
Design and implement a high-converting landing page that clearly communicates HyperKit value and drives sign-ups. The page should:
- Load in under 2 seconds
- Score 90+ on Lighthouse
- Convert 5%+ visitors to sign-ups
- Work on all devices

## Success Metrics
- Lighthouse performance score: 90+
- Time to interactive: under 2 seconds
- Mobile responsiveness: All breakpoints work
- Conversion rate: 5%+ (measured post-launch)
- Bounce rate: under 50%

## Technical Scope

Files to create:
```
apps/landing/
├── package.json
├── next.config.js
├── tailwind.config.js
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── Hero.tsx
│   ├── Features.tsx
│   ├── HowItWorks.tsx
│   ├── Chains.tsx
│   ├── Pricing.tsx
│   ├── CTA.tsx
│   ├── Footer.tsx
│   └── ui/
│       ├── Button.tsx
│       └── Card.tsx
└── public/
    ├── images/
    └── icons/
```

Dependencies:
- Next.js 14
- Tailwind CSS 3.x
- Framer Motion
- shadcn/ui

Integration points:
- Dashboard app (CTA links)
- Analytics (tracking)
- Marketing campaigns

## Minimal Code

```tsx
// app/page.tsx
import { Hero } from '@/components/Hero'
import { Features } from '@/components/Features'
import { HowItWorks } from '@/components/HowItWorks'
import { Chains } from '@/components/Chains'
import { Pricing } from '@/components/Pricing'
import { CTA } from '@/components/CTA'
import { Footer } from '@/components/Footer'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <Features />
      <HowItWorks />
      <Chains />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  )
}
```

```tsx
// components/Hero.tsx
'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
      
      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-bold text-white mb-6"
        >
          Build dApps in
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            {' '}87 seconds
          </span>
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto"
        >
          AI-powered smart contract generation. Deploy to 100+ chains.
          Auto-audit with TEE security. Earn while you build.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-4 justify-center"
        >
          <Link href="/dashboard">
            <Button size="lg" variant="primary">
              Start Building
            </Button>
          </Link>
          <Link href="#demo">
            <Button size="lg" variant="outline">
              Watch Demo
            </Button>
          </Link>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-sm text-gray-400"
        >
          No credit card required. Free tier available.
        </motion.div>
      </div>
    </section>
  )
}
```

```tsx
// components/Features.tsx
const features = [
  {
    title: 'AI Code Generation',
    description: 'Describe your contract in plain English. Get production-ready Solidity in seconds.',
    icon: '🤖'
  },
  {
    title: '100+ Chains',
    description: 'Deploy to Ethereum, Solana, SUI, and 100+ networks with one click.',
    icon: '🌐'
  },
  {
    title: 'Auto-Audit',
    description: 'Every contract scanned by Slither and AI. TEE-verified security.',
    icon: '🔒'
  },
  {
    title: 'Earn Points',
    description: 'Create templates, find bugs, contribute. Earn HYPE tokens.',
    icon: '💰'
  },
  {
    title: 'Gas Optimized',
    description: 'AI optimizes your contracts for minimal gas consumption.',
    icon: '⚡'
  }
]

export function Features() {
  return (
    <section className="py-24 bg-slate-900">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
          Everything you need to build Web3
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div
              key={i}
              className="p-6 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-purple-500 transition-colors"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

```tsx
// components/HowItWorks.tsx
const steps = [
  {
    step: '01',
    title: 'Describe',
    description: 'Tell HyperKit what you want to build in plain English.'
  },
  {
    step: '02',
    title: 'Review',
    description: 'AI generates code. Review audit results. Make edits if needed.'
  },
  {
    step: '03',
    title: 'Deploy',
    description: 'One click deployment. Live on your chosen blockchain in seconds.'
  }
]

export function HowItWorks() {
  return (
    <section className="py-24 bg-slate-950">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-16">
          How it works
        </h2>
        
        <div className="grid md:grid-cols-3 gap-12">
          {steps.map((item, i) => (
            <div key={i} className="text-center">
              <div className="text-6xl font-bold text-purple-500/20 mb-4">
                {item.step}
              </div>
              <h3 className="text-2xl font-semibold text-white mb-2">
                {item.title}
              </h3>
              <p className="text-gray-400">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

## Acceptance Criteria
- [ ] Hero section with value proposition
- [ ] Features section (5 cards)
- [ ] How it works section (3 steps)
- [ ] Supported chains section
- [ ] Pricing preview section
- [ ] CTA buttons link to dashboard
- [ ] Footer with links
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Dark mode styling
- [ ] Lighthouse score 90+
- [ ] Page loads in under 2 seconds
- [ ] Animations smooth (60fps)

## Dependencies
- TASK-S1-007: Product Requirements Documentation

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes

