# TASK-S4-032: Wallet Integration

## Metadata
- Assignee: Tristan
- Role: CMFO/Frontend
- Sprint: 4
- Priority: P0
- Status: BACKLOG
- Due Date: 2026-01-28
- Estimated Hours: 10h
- Actual Hours: 

## Problem
Users cannot authenticate or sign transactions. Without wallet:
- No user identity
- Cannot verify ownership
- Cannot sign deployments
- No Web3 experience

Current state: No wallet connection. Mock authentication only.

## Goal
Integrate MetaMask and other wallets for authentication and transaction signing.

## Success Metrics
- MetaMask connection working
- WalletConnect supported
- Coinbase Wallet supported
- Sign-in with Ethereum (SIWE)
- Mobile wallet deep links

## Technical Scope

Files to create:
```
frontend/
├── providers/
│   └── wallet-provider.tsx
├── hooks/
│   ├── use-wallet.ts
│   ├── use-auth.ts
│   └── use-sign.ts
├── components/
│   ├── connect-button.tsx
│   └── wallet-modal.tsx
└── lib/
    └── wagmi-config.ts
```

Dependencies:
- wagmi 2.x
- viem
- @rainbow-me/rainbowkit
- siwe

## Minimal Code

```typescript
// frontend/lib/wagmi-config.ts
import { createConfig, http } from 'wagmi';
import { mainnet, polygon, mantle, mantleTestnet, sepolia } from 'wagmi/chains';
import { coinbaseWallet, walletConnect, injected } from 'wagmi/connectors';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!;

export const config = createConfig({
  chains: [mainnet, polygon, mantle, mantleTestnet, sepolia],
  connectors: [
    injected(),
    walletConnect({ projectId }),
    coinbaseWallet({ appName: 'HyperKit' }),
  ],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [mantle.id]: http(),
    [mantleTestnet.id]: http(),
    [sepolia.id]: http(),
  },
});

// Chain metadata for UI
export const CHAIN_CONFIG = {
  [mainnet.id]: {
    name: 'Ethereum',
    icon: '/chains/ethereum.svg',
    explorer: 'https://etherscan.io',
  },
  [polygon.id]: {
    name: 'Polygon',
    icon: '/chains/polygon.svg',
    explorer: 'https://polygonscan.com',
  },
  [mantle.id]: {
    name: 'Mantle',
    icon: '/chains/mantle.svg',
    explorer: 'https://explorer.mantle.xyz',
  },
  [mantleTestnet.id]: {
    name: 'Mantle Testnet',
    icon: '/chains/mantle.svg',
    explorer: 'https://explorer.testnet.mantle.xyz',
  },
  [sepolia.id]: {
    name: 'Sepolia',
    icon: '/chains/ethereum.svg',
    explorer: 'https://sepolia.etherscan.io',
  },
};
```

```typescript
// frontend/providers/wallet-provider.tsx
'use client';

import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { config } from '@/lib/wagmi-config';
import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#0ea5e9',
            accentColorForeground: 'white',
            borderRadius: 'medium',
          })}
          modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

```typescript
// frontend/hooks/use-auth.ts
import { useAccount, useSignMessage, useDisconnect } from 'wagmi';
import { SiweMessage } from 'siwe';
import { useCallback, useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
}

interface User {
  address: string;
  chainId: number;
  nonce: string;
}

export function useAuth() {
  const { address, chainId, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    error: null,
  });
  
  // Check existing session
  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const res = await fetch('/api/auth/session');
      if (!res.ok) return null;
      return res.json();
    },
    enabled: isConnected,
  });
  
  // Sign in mutation
  const signInMutation = useMutation({
    mutationFn: async () => {
      if (!address || !chainId) throw new Error('Wallet not connected');
      
      // Get nonce from server
      const nonceRes = await fetch('/api/auth/nonce');
      const { nonce } = await nonceRes.json();
      
      // Create SIWE message
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in to HyperKit',
        uri: window.location.origin,
        version: '1',
        chainId,
        nonce,
      });
      
      const messageToSign = message.prepareMessage();
      
      // Sign message
      const signature = await signMessageAsync({ message: messageToSign });
      
      // Verify on server
      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageToSign, signature }),
      });
      
      if (!verifyRes.ok) {
        throw new Error('Verification failed');
      }
      
      return verifyRes.json();
    },
    onSuccess: (data) => {
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        user: data.user,
        error: null,
      });
    },
    onError: (error) => {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
    },
  });
  
  // Sign out
  const signOut = useCallback(async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    disconnect();
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: null,
    });
  }, [disconnect]);
  
  // Auto sign-in when connected and no session
  useEffect(() => {
    if (isConnected && !session && !sessionLoading && !authState.isAuthenticated) {
      // Prompt sign-in
    }
  }, [isConnected, session, sessionLoading, authState.isAuthenticated]);
  
  // Update auth state from session
  useEffect(() => {
    if (session) {
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        user: session.user,
        error: null,
      });
    } else if (!sessionLoading) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
      }));
    }
  }, [session, sessionLoading]);
  
  return {
    ...authState,
    signIn: signInMutation.mutate,
    signOut,
    isSigningIn: signInMutation.isPending,
  };
}
```

```typescript
// frontend/components/connect-button.tsx
'use client';

import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, LogOut, User, Settings } from 'lucide-react';
import Link from 'next/link';

export function ConnectButton() {
  const { isAuthenticated, user, signOut, signIn, isSigningIn } = useAuth();
  
  return (
    <RainbowConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const connected = mounted && account && chain;
        
        if (!connected) {
          return (
            <Button onClick={openConnectModal}>
              Connect Wallet
            </Button>
          );
        }
        
        // Connected but not authenticated
        if (!isAuthenticated) {
          return (
            <Button onClick={() => signIn()} disabled={isSigningIn}>
              {isSigningIn ? 'Signing...' : 'Sign In'}
            </Button>
          );
        }
        
        // Fully authenticated
        return (
          <div className="flex items-center gap-2">
            {/* Chain Selector */}
            <Button
              variant="outline"
              size="sm"
              onClick={openChainModal}
              className="gap-2"
            >
              {chain.hasIcon && (
                <img
                  alt={chain.name ?? 'Chain'}
                  src={chain.iconUrl}
                  className="w-4 h-4"
                />
              )}
              {chain.name}
            </Button>
            
            {/* Account Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  {account.displayName}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={openAccountModal}>
                  <User className="mr-2 h-4 w-4" />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      }}
    </RainbowConnectButton.Custom>
  );
}
```

```typescript
// frontend/hooks/use-sign.ts
import { useSignTypedData, useAccount } from 'wagmi';
import { useMutation } from '@tanstack/react-query';

interface BuildApproval {
  buildId: string;
  chains: number[];
  contractHash: string;
  timestamp: number;
}

export function useSignBuildApproval() {
  const { address } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  
  return useMutation({
    mutationFn: async (approval: BuildApproval) => {
      const domain = {
        name: 'HyperKit',
        version: '1',
        chainId: 1,
        verifyingContract: '0x0000000000000000000000000000000000000000' as `0x${string}`,
      };
      
      const types = {
        BuildApproval: [
          { name: 'buildId', type: 'string' },
          { name: 'chains', type: 'uint256[]' },
          { name: 'contractHash', type: 'bytes32' },
          { name: 'timestamp', type: 'uint256' },
        ],
      };
      
      const signature = await signTypedDataAsync({
        domain,
        types,
        primaryType: 'BuildApproval',
        message: {
          buildId: approval.buildId,
          chains: approval.chains.map(BigInt),
          contractHash: approval.contractHash as `0x${string}`,
          timestamp: BigInt(approval.timestamp),
        },
      });
      
      // Submit to backend
      const res = await fetch(`/api/v1/builds/${approval.buildId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature,
          signer: address,
        }),
      });
      
      return res.json();
    },
  });
}
```

## Acceptance Criteria
- [ ] Wagmi v2 configured
- [ ] RainbowKit integrated
- [ ] MetaMask connection working
- [ ] WalletConnect working
- [ ] Coinbase Wallet working
- [ ] SIWE authentication
- [ ] Session management
- [ ] Chain switching
- [ ] Account display
- [ ] Sign out functionality
- [ ] Typed data signing
- [ ] Build approval signing
- [ ] Mobile deep links
- [ ] Error handling
- [ ] Loading states
- [ ] ENS name resolution

## Dependencies
- TASK-S2-025: Design System

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes


