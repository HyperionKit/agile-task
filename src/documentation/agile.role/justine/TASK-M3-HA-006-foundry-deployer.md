# TASK-M3-HA-006: Foundry Deployment Integration

## Metadata
- Assignee: Justine
- Role: CPOO/Project Architect
- Month: 3 (December 2025)
- Priority: P0
- Status: BACKLOG
- Due Date: 2025-12-20
- Estimated Hours: 10h
- Actual Hours: 

## Problem
Foundry deployment not integrated. Without deployment:
- Cannot deploy contracts
- Missing core functionality
- Platform incomplete
- No on-chain presence

Current state: Foundry deployment not implemented.

## Goal
Integrate Foundry deployment: deploy contracts using forge, verify on block explorer, multi-contract deployment.

## Success Metrics
- Foundry install + config working
- forge create working
- Block explorer verification functional
- Multi-contract deployment working
- Documentation complete

## Technical Scope

Files to create/modify:
```
backend/
├── hyperagent/
│   └── deploy/
│       ├── foundry_deployer.py
│       └── contract_verifier.py
```

Dependencies:
- Foundry
- Block explorer APIs

## Minimal Code

```python
# backend/hyperagent/deploy/foundry_deployer.py
import subprocess
import json
import os

class FoundryDeployer:
    def __init__(self, chain: str, rpc: string, private_key: str):
        self.chain = chain
        self.rpc = rpc
        self.private_key = private_key

    async def deploy_contracts(
        self,
        contracts: List[Contract],
        constructor_args: Dict[str, List[str]],
        verify: bool = True
    ) -> DeploymentResult:
        """
        Deploy contracts using Foundry forge
        """
        with tempfile.TemporaryDirectory() as tmpdir:
            src_dir = os.path.join(tmpdir, "src")
            os.makedirs(src_dir)

            for contract in contracts:
                path = os.path.join(src_dir, f"{contract.name}.sol")
                with open(path, "w") as f:
                    f.write(contract.code)

            foundry_config = f"""
            [profile.default]
            src = "src"
            out = "out"
            libs = ["lib"]
            
            [etherscan]
            mantle = {{key = "{os.getenv('MANTLE_ETHERSCAN_KEY')}"}}
            metis = {{key = "{os.getenv('METIS_ETHERSCAN_KEY')}"}}
            """

            with open(os.path.join(tmpdir, "foundry.toml"), "w") as f:
                f.write(foundry_config)

            deployments = {}
            for contract in contracts:
                cmd = [
                    "forge", "create",
                    f"src/{contract.name}.sol:{contract.name}",
                    f"--rpc-url={self.rpc}",
                    f"--private-key={self.private_key}",
                    "--json"
                ]

                if contract.name in constructor_args:
                    args = " ".join(constructor_args[contract.name])
                    cmd.append(f"--constructor-args={args}")

                result = subprocess.run(
                    cmd,
                    cwd=tmpdir,
                    capture_output=True,
                    text=True,
                    timeout=120
                )

                output = json.loads(result.stdout)
                deployments[contract.name] = {
                    "address": output["deployedTo"],
                    "transactionHash": output["transactionHash"],
                    "blockNumber": output["blockNumber"]
                }

                if verify:
                    await self.verify_contract(
                        contract.name,
                        deployments[contract.name]["address"],
                        constructor_args.get(contract.name, [])
                    )

            return DeploymentResult(
                deployments=deployments,
                chain=self.chain,
                timestamp=datetime.now()
            )

    async def verify_contract(
        self,
        contract_name: str,
        address: str,
        constructor_args: List[str]
    ):
        """
        Verify contract source on block explorer
        """
        cmd = [
            "forge", "verify-contract",
            address,
            f"src/{contract_name}.sol:{contract_name}",
            f"--verifier=etherscan",
            f"--verifier-url=https://api.{self.chain}.etherscan.io/api",
            f"--compiler-version=v0.8.24"
        ]

        if constructor_args:
            cmd.append(f"--constructor-args={constructor_args}")

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60
        )

        if result.returncode != 0:
            print(f"Verification warning: {result.stderr}")
```

## Acceptance Criteria
- [ ] Foundry install + config
- [ ] forge create working
- [ ] Block explorer verification
- [ ] Multi-contract deployment
- [ ] Documentation complete

## Dependencies
- TASK-M3-HA-003: Solidity Code Generator

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes

