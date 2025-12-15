# TASK-M3-HA-002: Firecrawl RAG Pipeline

## Metadata
- Assignee: Justine
- Role: CPOO/Project Architect
- Month: 3 (December 2025)
- Priority: P0
- Status: BACKLOG
- Due Date: 2025-12-20
- Estimated Hours: 12h
- Actual Hours: 

## Problem
Firecrawl RAG pipeline not built. Without RAG:
- No live doc scraping
- Missing context for code generation
- Poor code quality
- Outdated patterns

Current state: RAG pipeline not implemented.

## Goal
Build Firecrawl RAG pipeline: crawl 6+ docs (Uniswap, Aave, Curve, Yearn, MakerDAO, Compound), index into Pinecone vector DB, enable semantic search.

## Success Metrics
- 6+ docs crawled and indexed
- Vector DB (Pinecone) operational
- Semantic search working
- Context generation accurate
- Documentation complete

## Technical Scope

Files to create/modify:
```
backend/
├── hyperagent/
│   └── rag/
│       ├── firecrawl_pipeline.py
│       ├── vector_store.py
│       └── retriever.py
```

Dependencies:
- Firecrawl MCP
- Pinecone
- Embeddings model

## Minimal Code

```python
# backend/hyperagent/rag/firecrawl_rag.py
from firecrawl_mcp import Firecrawl
from pinecone import Pinecone

class RagPipeline:
    def __init__(self):
        self.firecrawl = Firecrawl()
        self.pinecone = Pinecone(api_key=PINECONE_API_KEY)
        self.index = self.pinecone.Index("hyperkit-docs")

    async def crawl_and_index(self):
        """
        Crawl latest docs for Uniswap, Aave, Curve, Yearn, etc.
        Index into vector DB for semantic search
        """
        docs = {
            "uniswap_v4": "https://github.com/Uniswap/v4-core",
            "aave_v3": "https://docs.aave.com/",
            "curve": "https://curve.readthedocs.io/",
            "yearn": "https://docs.yearn.finance/",
            "makerdao": "https://github.com/makerdao/dss",
            "compound": "https://compound.finance/docs/v3",
        }

        for name, url in docs.items():
            content = await self.firecrawl.crawl(url, {
                "includeMarkdown": True,
                "markdownTransformer": "gfm",
                "maxDepth": 5
            })

            chunks = self.chunk_content(content, chunk_size=1000)

            for i, chunk in enumerate(chunks):
                embedding = await self.generate_embedding(chunk)
                
                self.index.upsert(
                    vectors=[(
                        f"{name}_{i}",
                        embedding,
                        {
                            "source": name,
                            "url": url,
                            "text": chunk,
                            "type": "documentation"
                        }
                    )]
                )

    async def search(self, query: str, top_k: int = 5) -> List[Document]:
        """
        Semantic search for relevant patterns
        """
        embedding = await self.generate_embedding(query)
        results = self.index.query(
            vector=embedding,
            top_k=top_k,
            includeMetadata=True
        )

        return [
            Document(
                source=match.metadata["source"],
                text=match.metadata["text"],
                url=match.metadata["url"]
            )
            for match in results.matches
        ]

    async def generate_context(self, prompt: str) -> str:
        """
        Generate RAG context for a given prompt
        """
        relevant_docs = await self.search(prompt)
        
        context = "## Relevant Documentation\n\n"
        for doc in relevant_docs:
            context += f"### From {doc.source}\n{doc.text}\n\n"
        
        return context
```

## Acceptance Criteria
- [ ] 6+ docs crawled and indexed
- [ ] Vector DB (Pinecone) operational
- [ ] Semantic search working
- [ ] Context generation accurate
- [ ] Documentation complete

## Dependencies
None

## Progress Log
| Date | Update | Hours |
|------|--------|-------|

## Review Notes

