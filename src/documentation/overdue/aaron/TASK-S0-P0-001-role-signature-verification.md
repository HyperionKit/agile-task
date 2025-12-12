# TASK-S0-P0-001: Role Signature Verification (CRITICAL)

## Metadata
- Assignee: Aaron
- Role: CTO/Project Architect
- Sprint: 0 (Pre-Sprint Critical)
- Priority: P0 (CRITICAL)
- Status: OVERDUE
- Original Due Date: 2025-12-10
- New Due Date: 2025-12-13
- Estimated Hours: 4h
- Actual Hours: 

## Problem
HyperAgent uses YAML role files to define AI behaviors. Without signature verification:
- Attackers publish malicious roles disguised as helpers
- "MEV Protector" role steals funds instead of protecting
- Supply chain attack compromises ALL users
- No way to distinguish trusted from malicious roles

Security research shows supply chain attacks have 100% success rate without verification.

Current state: Roles load from YAML without any verification. Critical vulnerability.

## Goal
Implement cryptographic signature verification for all role files. This ensures:
- Only team-approved roles execute
- Tampered files rejected immediately
- Clear audit trail of trusted roles
- Supply chain attacks blocked

## Success Metrics
- Zero unsigned roles execute
- Signature verification in under 10ms
- All existing roles signed
- Attack simulation blocked
- No false positives on valid roles

## Technical Scope

Files to create:
```
backend/hyperagent/
├── security/
│   ├── role_verifier.py
│   └── signatures.yaml
├── roles/
│   ├── gas_optimizer.yaml
│   ├── mev_protector.yaml
│   └── audit_role.yaml
```

Dependencies:
- ed25519 (cryptographic signatures)
- PyYAML
- cryptography library

Integration points:
- HyperAgent role loader
- All role YAML files
- CI/CD for signing new roles

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
    
    @staticmethod
    def sign_role(role_path: str, private_key_hex: str) -> Dict[str, str]:
        """
        Sign a role file (for CI/CD use only).
        Returns hash and signature for signatures.yaml.
        """
        private_key = ed25519.Ed25519PrivateKey.from_private_bytes(
            bytes.fromhex(private_key_hex)
        )
        
        with open(role_path, 'rb') as f:
            content = f.read()
        
        file_hash = hashlib.sha256(content).hexdigest()
        signature = private_key.sign(content).hex()
        
        return {
            'hash': file_hash,
            'signature': signature
        }
```

```yaml
# backend/hyperagent/security/signatures.yaml
# TRUSTED ROLE SIGNATURES
# Do NOT modify manually. Generated by CI/CD pipeline.
# Each role must be signed before deployment.

signatures:
  gas_optimizer:
    hash: "a1b2c3d4e5f6..."  # SHA-256 of file
    signature: "0x1234..."    # Ed25519 signature
    signed_by: "team@hyperkit.dev"
    signed_at: "2025-12-10T00:00:00Z"
    
  mev_protector:
    hash: "f6e5d4c3b2a1..."
    signature: "0x5678..."
    signed_by: "team@hyperkit.dev"
    signed_at: "2025-12-10T00:00:00Z"
    
  audit_role:
    hash: "9876543210ab..."
    signature: "0x9abc..."
    signed_by: "team@hyperkit.dev"
    signed_at: "2025-12-10T00:00:00Z"
```

```python
# backend/hyperagent/loader.py (integration)
from security.role_verifier import RoleVerifier, RoleVerificationError

verifier = RoleVerifier()

async def load_role(role_name: str) -> Dict:
    """Load role with mandatory verification"""
    try:
        return await verifier.load_and_verify_role(role_name)
    except RoleVerificationError as e:
        # Log security event
        await log_security_event(
            event="ROLE_VERIFICATION_FAILED",
            role=role_name,
            error=str(e)
        )
        # Do NOT fall back to unverified loading
        raise
```

## Acceptance Criteria
- [ ] RoleVerifier class implemented
- [ ] Ed25519 signature verification working
- [ ] SHA-256 hash verification working
- [ ] signatures.yaml file created
- [ ] All existing roles signed
- [ ] Unsigned roles rejected with clear error
- [ ] Tampered roles rejected
- [ ] Verification under 10ms
- [ ] Unit tests for all verification paths
- [ ] Integration with role loader
- [ ] CI/CD pipeline signs new roles
- [ ] Security event logging

## Dependencies
- None (Security Critical - no blockers)

## Progress Log
| Date | Update | Hours |
|------|--------|-------|
| 2025-12-10 | Originally due, blocked by other tasks | 0h |
| 2025-12-12 | Escalated to P0, detailed spec added | 1h |

## Review Notes
SECURITY CRITICAL: Must be reviewed by 2 team members.
Attack simulation required before merge.

