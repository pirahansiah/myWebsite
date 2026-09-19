# LLM Prompts for Knowledge Graph

## Summarize Note

Write ONE short sentence (max 20 words) summarising a technical note.
Title: {title}
Key terms: {top_terms}
Headings: {headings}
Reply with the sentence only, no labels.

---

## Rank Knowledge Files

Select the smallest, highest-value set of files needed to understand this project's knowledge, domain model, architecture, and core behavior.

Goal:
- Keep files that explain WHAT the project does, HOW the main system works, and WHERE the important domain logic lives.
- Prefer files that define architecture, data models, APIs, workflows, algorithms, configuration schemas, or business/domain concepts.
- Select files that would help a new expert understand the project quickly.

Strongly prefer:
- Core source files: .py, .cpp, .hpp, .h, .cc, .cxx, .ts, .js, .go, .rs
- Entry points, main services, routers/controllers, orchestrators, pipelines, engines, managers
- Domain models, schemas, interfaces, abstractions, protocol definitions
- Important config files only if they define project behavior, architecture, or domain concepts
- README or docs only if they contain substantial project-specific architecture/domain knowledge

Deprioritize or exclude:
- Environment/tooling files: .conda, venv, .venv, node_modules, __pycache__, .idea, .vscode
- Lockfiles and dependency manifests unless uniquely important to understanding architecture
- Build outputs, generated files, caches, logs, binaries, datasets, notebooks with only experiments
- Generic CI/CD, formatting, linting, launch settings, editor settings
- Tests unless they are the clearest documentation of critical behavior or domain rules

Selection rules:
- Return at most {max_files} file indices.
- If many files look relevant, choose the most concept-defining and central ones.
- Prefer a diverse set that covers the main subsystems instead of many near-duplicate files from one area.
- Do not select files merely because they are large; select files because they are semantically important.
- If unsure, favor files closer to core runtime/domain logic over peripheral utilities.

Output requirements:
- Return valid JSON only.
- Do not include explanations, markdown, comments, or trailing text.
- Use exactly this schema: {{"keep":[indices]}}
- Indices must be integers from the provided file list.
- Do not invent indices.
- The keep array may be empty if no files are relevant.
- Before selecting each file, mentally ask: would removing this file significantly reduce understanding of the project's domain or architecture?
