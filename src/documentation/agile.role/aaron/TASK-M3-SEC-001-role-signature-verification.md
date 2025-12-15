# TASK-M3-SEC-001: Role Signature Verification

## Metadata
- Assignee: Aaron
- Role: CTO/Project Architect
- Month: 3 (December 2025)
- Priority: P0
- Status: BACKLOG
- Due Date: 2025-12-15
- Estimated Hours: 8h
- Actual Hours: 

## Problem
No role signature verification. Without verification:
- Supply chain attacks possible
- Malicious roles can be injected
- All users compromised
- Platform security at risk

Current state: Role YAML files not cryptographically verified.

## Goal
Implement role signature verification to prevent supply chain attacks. All role files must be signed and verified before loading.

## Success Metrics
- Role signature verification implemented
- All roles cryptographically signed
- Verification on load working
- Supply chain attacks blocked
- Security audit passed

## Technical Scope

Files to create/modify:
```
backend/
├── hyperagent/
│   └── security/
│       ├── role_verifier.py
│       └── signatures.yaml
└── roles/
    └── *.yaml (must be signed)
```

Dependencies:
- cryptography library
- ed25519 signatures

## Minimal Code

```python
# backend/hyperagent/security/role_verifier.py
import os
import hashlib
from pathlib import Path
from typing import Dict, Optional
import yaml
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ed25519

class RoleVerificationError(Exception):
    """Raised when role signature verification fails"""
    pass

class RoleVerifier:
    """
    Cryptographic verification of role YAML files.
    Prevents supply chain attacks by ensuring only
    team-signed roles are loaded.
    """
    
    def __init__(self, signatures_path: str = "security/signatures.yaml"):
        self.signatures_path = signatures_path
        self.trusted_signatures = self._load_signatures()
        self.public_key = self._load_public_key()
    
    def _load_signatures(self) -> Dict[str, str]:
        """Load trusted signature registry"""
        with open(self.signatures_path, 'r') as f:
            data = yaml.safe_load(f)
        return data.get('signatures', {})
    
    def _load_public_key(self) -> ed25519.Ed25519PublicKey:
        """Load team public key for verification"""
        key_hex = os.getenv("ROLE_SIGNING_PUBLIC_KEY")
        if not key_hex:
            raise ValueError("ROLE_SIGNING_PUBLIC_KEY not set")
        key_bytes = bytes.fromhex(key_hex)
        return ed25519.Ed25519PublicKey.from_public_bytes(key_bytes)
    
    def compute_file_hash(self, file_path: str) -> str:
        """Compute SHA-256 hash of file contents"""
        with open(file_path, 'rb') as f:
            content = f.read()
        return hashlib.sha256(content).hexdigest()
    
    def verify_signature(self, file_path: str, signature_hex: str) -> bool:
        """Verify ed25519 signature of file"""
        try:
            with open(file_path, 'rb') as f:
                content = f.read()
            signature = bytes.fromhex(signature_hex)
            self.public_key.verify(signature, content)
            return True
        except Exception:
            return False
    
    async def load_and_verify_role(self, role_name: str) -> Dict:
        """
        Load role file with cryptographic verification.
        
        Steps:
        1. Check role exists in trusted registry
        2. Verify file hash matches expected
        3. Verify cryptographic signature
        4. Parse and return YAML only if all checks pass
        
        Raises:
            RoleVerificationError: If any verification fails
        """
        role_file = f"roles/{role_name}.yaml"
        
        # Step 1: Check trusted registry
        if role_name not in self.trusted_signatures:
            raise RoleVerificationError(
                f"SECURITY: Role '{role_name}' not in trusted registry. "
                f"Contact team to add new roles."
            )
        
        trusted = self.trusted_signatures[role_name]
        expected_hash = trusted['hash']
        signature = trusted['signature']
        
        # Step 2: Verify file hash
        actual_hash = self.compute_file_hash(role_file)
        if actual_hash != expected_hash:
            raise RoleVerificationError(
                f"SECURITY: Role '{role_name}' hash mismatch. "
                f"File may be corrupted or tampered. "
                f"Expected: {expected_hash[:16]}..., Got: {actual_hash[:16]}..."
            )
        
        # Step 3: Verify cryptographic signature
        if not self.verify_signature(role_file, signature):
            raise RoleVerificationError(
                f"SECURITY: Role '{role_name}' signature invalid. "
                f"File not signed by trusted key."
            )
        
        # Step 4: Safe to load
        with open(role_file, 'r') as f:
            role_config = yaml.safe_load(f)
        
        return role_config
```

## Acceptance Criteria
- [ ] RoleVerifier class implemented
- [ ] Signature verification working
- [ ] All existing roles signed
- [ ] CI/CD signs new roles
- [ ] Security audit passed
- [ ] Documentation complete

## Dependencies
None

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes

