# TASK-S5-034: HyperAgent Template Integration

## Metadata
- Assignee: Aaron
- Role: CTO/Project Architect
- Sprint: 5 (Month 3)
- Priority: P0
- Status: BACKLOG
- Due Date: 2026-02-18
- Estimated Hours: 16h
- Actual Hours: 

## Problem
Templates exist but HyperAgent cannot use them intelligently. Without integration:
- Users must manually select templates
- No prompt-to-deployment flow
- Cannot parse "create staking pool on Metis" commands
- No parameterization from natural language

Current state: Templates static. HyperAgent generates from scratch.

## Goal
Integrate DeFi templates into HyperAgent so prompts like "create staking pool on Metis" produce parameterized contracts with deployment plans.

## Success Metrics
- HyperAgent recognizes 10+ template-triggering prompts
- Automatic parameter extraction from prompts
- Template selection accuracy above 90%
- End-to-end prompt-to-deploy working
- Under 30 seconds for template-based generation

## Technical Scope

Files to create/modify:
```
backend/hyperagent/
├── templates/
│   ├── __init__.py
│   ├── registry.py
│   ├── matcher.py
│   ├── parameterizer.py
│   └── prompts/
│       ├── defi_vault.py
│       ├── defi_staking.py
│       └── defi_swap.py
└── tests/
    └── test_template_integration.py
```

Dependencies:
- Claude 4.5 for intent extraction
- Template configs from packages/templates

## Minimal Code

```python
# backend/hyperagent/templates/registry.py
from dataclasses import dataclass
from typing import Dict, List, Optional
import json
from pathlib import Path

@dataclass
class TemplateConfig:
    name: str
    template_id: str
    networks: List[str]
    description: str
    parameters: Dict
    keywords: List[str]
    prompt_patterns: List[str]
    file_path: str

class TemplateRegistry:
    """
    Registry of available contract templates.
    Supports network-specific and DeFi templates.
    """
    
    def __init__(self, templates_dir: str = "packages/templates"):
        self.templates_dir = Path(templates_dir)
        self.templates: Dict[str, TemplateConfig] = {}
        self._load_templates()
    
    def _load_templates(self):
        """Load all template configs from directory"""
        
        for config_path in self.templates_dir.rglob("config.json"):
            with open(config_path) as f:
                config = json.load(f)
            
            template_id = config.get("template", "").replace("/", "-").lower()
            
            self.templates[template_id] = TemplateConfig(
                name=config.get("template", ""),
                template_id=template_id,
                networks=config.get("network", []),
                description=config.get("description", ""),
                parameters=config.get("parameters", {}),
                keywords=self._extract_keywords(config),
                prompt_patterns=config.get("promptPatterns", []),
                file_path=str(config_path.parent)
            )
    
    def _extract_keywords(self, config: dict) -> List[str]:
        """Extract keywords for matching"""
        keywords = []
        
        # From template name
        template_name = config.get("template", "").lower()
        keywords.extend(template_name.replace("/", " ").replace("-", " ").split())
        
        # From description
        desc = config.get("description", "").lower()
        defi_words = ["vault", "staking", "swap", "lending", "pool", "yield", "farm"]
        keywords.extend([w for w in defi_words if w in desc])
        
        # Network keywords
        networks = config.get("network", [])
        keywords.extend([n.lower() for n in networks])
        
        return list(set(keywords))
    
    def find_by_network(self, network: str) -> List[TemplateConfig]:
        """Find templates supporting a network"""
        network = network.lower()
        return [
            t for t in self.templates.values()
            if network in [n.lower() for n in t.networks] or not t.networks
        ]
    
    def find_by_keywords(self, keywords: List[str]) -> List[TemplateConfig]:
        """Find templates matching keywords"""
        keywords = [k.lower() for k in keywords]
        
        matches = []
        for template in self.templates.values():
            score = sum(1 for k in keywords if k in template.keywords)
            if score > 0:
                matches.append((template, score))
        
        # Sort by match score
        matches.sort(key=lambda x: x[1], reverse=True)
        return [t for t, _ in matches]
    
    def get_template(self, template_id: str) -> Optional[TemplateConfig]:
        """Get specific template by ID"""
        return self.templates.get(template_id.lower())


# backend/hyperagent/templates/matcher.py
from typing import Optional, Tuple, List
import re

class TemplateMatcher:
    """
    Matches user prompts to appropriate templates.
    Uses keyword extraction and intent classification.
    """
    
    DEFI_PATTERNS = {
        "vault": [
            r"(create|build|deploy)\s+.*vault",
            r"yield\s+(vault|strategy)",
            r"erc-?4626",
        ],
        "staking": [
            r"(create|build|deploy)\s+.*staking",
            r"staking\s+pool",
            r"stake\s+.*tokens?",
        ],
        "swap": [
            r"(create|build|deploy)\s+.*swap",
            r"(simple|basic)\s+swap",
            r"token\s+swap",
            r"dex",
        ],
    }
    
    NETWORK_PATTERNS = {
        "metis": [r"\bmetis\b", r"\bmetis\s+testnet\b"],
        "hyperion": [r"\bhyperion\b", r"\bhyperion\s+testnet\b"],
        "ethereum": [r"\bethereum\b", r"\beth\b", r"\bmainnet\b"],
        "mantle": [r"\bmantle\b"],
    }
    
    def __init__(self, registry: 'TemplateRegistry'):
        self.registry = registry
    
    def match(self, prompt: str) -> Tuple[Optional[str], Optional[str], float]:
        """
        Match prompt to template and network.
        Returns (template_id, network, confidence)
        """
        prompt_lower = prompt.lower()
        
        # Extract template type
        template_type = self._extract_template_type(prompt_lower)
        
        # Extract network
        network = self._extract_network(prompt_lower)
        
        if not template_type:
            return None, network, 0.0
        
        # Find best matching template
        candidates = self.registry.find_by_keywords([template_type])
        
        if network:
            # Filter by network
            candidates = [
                t for t in candidates
                if network in [n.lower() for n in t.networks]
            ]
        
        if candidates:
            return candidates[0].template_id, network, 0.9
        
        return None, network, 0.0
    
    def _extract_template_type(self, prompt: str) -> Optional[str]:
        """Extract DeFi template type from prompt"""
        for template_type, patterns in self.DEFI_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, prompt, re.IGNORECASE):
                    return template_type
        return None
    
    def _extract_network(self, prompt: str) -> Optional[str]:
        """Extract target network from prompt"""
        for network, patterns in self.NETWORK_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, prompt, re.IGNORECASE):
                    return network
        return None


# backend/hyperagent/templates/parameterizer.py
from typing import Dict, Any, Optional
import re

class TemplateParameterizer:
    """
    Extracts template parameters from natural language prompts.
    Uses regex patterns and LLM for complex extraction.
    """
    
    COMMON_PATTERNS = {
        "name": [
            r"called\s+['\"]?([A-Za-z][A-Za-z0-9\s]+)['\"]?",
            r"named\s+['\"]?([A-Za-z][A-Za-z0-9\s]+)['\"]?",
        ],
        "symbol": [
            r"symbol\s+['\"]?([A-Z]{2,6})['\"]?",
            r"\(([A-Z]{2,6})\)",
        ],
        "fee": [
            r"(\d+(?:\.\d+)?)\s*%?\s*fee",
            r"fee\s+(?:of\s+)?(\d+(?:\.\d+)?)\s*%?",
        ],
        "duration": [
            r"(\d+)\s*(day|week|month|year)s?\s*lock",
            r"lock\s+(?:for\s+)?(\d+)\s*(day|week|month|year)s?",
        ],
        "amount": [
            r"(\d+(?:,\d{3})*(?:\.\d+)?)\s*(million|billion|k|m|b)?",
        ],
        "apr": [
            r"(\d+(?:\.\d+)?)\s*%?\s*apr",
            r"apr\s+(?:of\s+)?(\d+(?:\.\d+)?)\s*%?",
        ],
    }
    
    def __init__(self, llm_client=None):
        self.llm_client = llm_client
    
    def extract_parameters(
        self,
        prompt: str,
        template_config: Dict
    ) -> Dict[str, Any]:
        """Extract parameters from prompt based on template config"""
        
        params = {}
        required_params = template_config.get("parameters", {})
        
        # Try regex extraction first
        for param_name, param_config in required_params.items():
            value = self._extract_by_regex(prompt, param_name)
            
            if value:
                params[param_name] = self._convert_type(value, param_config)
            elif "default" in param_config:
                params[param_name] = param_config["default"]
        
        # Use LLM for complex extraction if needed
        missing = [
            p for p in required_params
            if p not in params and required_params[p].get("required", False)
        ]
        
        if missing and self.llm_client:
            llm_params = self._extract_with_llm(prompt, missing, required_params)
            params.update(llm_params)
        
        return params
    
    def _extract_by_regex(self, prompt: str, param_name: str) -> Optional[str]:
        """Extract parameter using regex patterns"""
        
        # Map param names to pattern keys
        pattern_key = param_name.lower().replace("_", "")
        
        for key, patterns in self.COMMON_PATTERNS.items():
            if key in pattern_key or pattern_key in key:
                for pattern in patterns:
                    match = re.search(pattern, prompt, re.IGNORECASE)
                    if match:
                        return match.group(1)
        
        return None
    
    def _convert_type(self, value: str, param_config: Dict) -> Any:
        """Convert extracted value to correct type"""
        param_type = param_config.get("type", "string")
        
        if param_type == "number":
            # Handle suffixes like "million", "k"
            multipliers = {
                "k": 1_000,
                "m": 1_000_000,
                "million": 1_000_000,
                "b": 1_000_000_000,
                "billion": 1_000_000_000,
            }
            
            value = value.replace(",", "")
            for suffix, mult in multipliers.items():
                if suffix in value.lower():
                    value = value.lower().replace(suffix, "").strip()
                    return float(value) * mult
            
            return float(value) if "." in value else int(value)
        
        return value
    
    async def _extract_with_llm(
        self,
        prompt: str,
        missing_params: List[str],
        param_configs: Dict
    ) -> Dict[str, Any]:
        """Use LLM to extract complex parameters"""
        
        extraction_prompt = f"""
        Extract the following parameters from this request:
        
        Request: {prompt}
        
        Parameters needed:
        {self._format_param_descriptions(missing_params, param_configs)}
        
        Return JSON with extracted values. Use null for values not found.
        """
        
        response = await self.llm_client.generate(extraction_prompt)
        
        try:
            import json
            return json.loads(response)
        except:
            return {}
    
    def _format_param_descriptions(
        self,
        params: List[str],
        configs: Dict
    ) -> str:
        """Format parameter descriptions for LLM"""
        lines = []
        for param in params:
            config = configs.get(param, {})
            desc = config.get("description", param)
            example = config.get("example", "")
            lines.append(f"- {param}: {desc} (example: {example})")
        return "\n".join(lines)
```

```python
# backend/hyperagent/templates/prompts/defi_vault.py
VAULT_SYSTEM_PROMPT = """
You are a DeFi vault contract generator. When the user requests a vault:

1. Identify the target network (Metis, Hyperion, Ethereum, etc.)
2. Extract vault parameters:
   - Vault name and symbol
   - Underlying asset
   - Performance fee (default 10%)
   - Fee recipient
3. Apply network-specific optimizations
4. Generate deployment plan

For Metis: Use L2 gas optimizations, consider sequencer interactions
For Hyperion: Include Hyperion-specific hooks and events

Always include safety checks:
- Validate fee recipient is not zero address
- Cap performance fee at 20%
- Require underlying asset to be valid ERC20
"""

VAULT_EXAMPLES = [
    {
        "prompt": "Create a USDC vault on Metis with 5% performance fee",
        "params": {
            "VAULT_NAME": "Metis USDC Vault",
            "VAULT_SYMBOL": "mUSDC",
            "CONTRACT_NAME": "MetisUSDCVault",
            "ASSET_ADDRESS": "{{USDC_METIS}}",
            "PERFORMANCE_FEE": 500,
            "FEE_RECIPIENT": "{{DEPLOYER}}"
        },
        "network": "metis-testnet"
    },
    {
        "prompt": "Deploy yield vault for ETH on Hyperion",
        "params": {
            "VAULT_NAME": "Hyperion ETH Vault",
            "VAULT_SYMBOL": "hETH",
            "CONTRACT_NAME": "HyperionETHVault",
            "ASSET_ADDRESS": "{{WETH_HYPERION}}",
            "PERFORMANCE_FEE": 1000,
            "FEE_RECIPIENT": "{{DEPLOYER}}"
        },
        "network": "hyperion-testnet"
    }
]
```

## Acceptance Criteria
- [ ] TemplateRegistry loads all template configs
- [ ] TemplateMatcher identifies template type from prompt
- [ ] TemplateMatcher extracts network from prompt
- [ ] TemplateParameterizer extracts parameters
- [ ] LLM fallback for complex parameter extraction
- [ ] DeFi vault prompts working
- [ ] DeFi staking prompts working
- [ ] End-to-end: prompt to parameterized contract
- [ ] 90%+ template selection accuracy
- [ ] Under 30 second generation time
- [ ] Unit tests for all components
- [ ] Integration tests with real prompts

## Dependencies
- TASK-S2-013: Claude Integration
- TASK-S5-033: DeFi Templates for Metis & Hyperion

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes
Month 3 Hyperion Milestone - HyperAgent Integration

