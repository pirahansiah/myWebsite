# Token Reduction Strategies

Advanced techniques for reducing token usage in AI-assisted development.

---

## 1. File-Level Reduction

- Use `.cursorignore` templates matched to project type
- Remove stale files: old MEMORY.md, DIRECTORY-TREE, FILE-INVENTORY
- Keep CLAUDE.md under 100 lines — project-relevant only
- Delete agent-memory/ from other projects
- Remove tool-specific files (.cursorignore variants, presentation.pptx)

## 2. Selective Loading

- Include only skills relevant to current project
- Exclude agents not used in this domain
- Load 2-3 rules max per project type
- Use `.gitignore` for secrets, `.cursorignore` for AI indexing

## 3. AST Skeletonization

- Strip function bodies, keep signatures only
- AI sees full project structure but only relevant implementation
- ~70-80% token reduction while maintaining 100% architectural awareness
- Tools: grep-ast (Aider), tree-sitter parsers

## 4. Prompt Caching (Anthropic/OpenAI)

- Checkpoint first 100KB of codebase context
- Subsequent requests only charge for new tokens + cache hit fee
- Keep CLAUDE.md and skills in cached block
- ~90% cost reduction for repetitive sessions

## 5. Semantic Compression (LLMLingua)

- Pre-process prompts through 7B model to remove non-essential tokens
- Up to 20x compression with minimal reasoning loss
- Remove filler words, verbose boilerplate, redundant comments
- Application: pre-processor script before expensive model calls

## 6. Multi-Model Routing

- Use cheap model (Haiku/GPT-4o-mini) for search/filter tasks
- Route only relevant files to expensive model (Sonnet/GPT-4o)
- Workflow: cheap model selects 3 files → expensive model codes
- ~80% cost reduction with high accuracy

## 7. Unified Diff Output

- Force AI to output search/replace blocks instead of full files
- 1000-line file → only 10 changed lines sent back
- 60-90% token savings on code generation
- Tools: Aider search/replace blocks, unified diff format

## 8. Codebase Memory Graph

- Index entire codebase into knowledge graph (codebase-memory-mcp)
- One graph query replaces dozens of grep/read cycles
- 10x fewer tokens, 99% reduction vs file-by-file exploration
- Linux kernel (28M LOC) indexes in 3 minutes

---

## Quick Reference

| Technique | Token Savings | Accuracy |
|-----------|--------------|----------|
| File cleanup | 60-95% | Perfect |
| .cursorignore | 50-90% | Perfect |
| AST Skeleton | 70-80% | High |
| Prompt Caching | 90% (cost) | Perfect |
| LLMLingua | 90-95% | Medium-High |
| Unified Diff | 60-90% | High |
| Multi-Model | 80% (cost) | High |
| codebase-memory | 99% | High |
