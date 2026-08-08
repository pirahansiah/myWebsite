---
name: portfolio
description: "Manage the project portfolio. Generate RESUME_ASSETS.md, update website, consolidate assets to global .claude folder."
trigger: /portfolio
---

# /portfolio

Portfolio management and career documentation workflow.

## Usage

```
/portfolio generate <path>           # Generate RESUME_ASSETS.md for a project
/portfolio consolidate               # Consolidate all RESUME_ASSETS.md to ~/.claude/
/portfolio remove                    # Remove RESUME_ASSETS.md from all repos
/portfolio update-website            # Update website use-cases.md with all projects
/portfolio full                      # Full portfolio update cycle
```

## Workflow

### Generate RESUME_ASSETS.md
1. Read README.md and source files in project
2. Understand project purpose, tech stack, and achievements
3. Generate RESUME_ASSETS.md with:
   - Project Narrative (legacy → modern transformation)
   - 5-7 STAR-format resume bullets (Action-Context-Result)
   - Benchmarking Data table (legacy vs modern performance)
   - Key Contributions / Industry Firsts
4. Generate ROADMAP.md with:
   - 12-month quarterly milestones
   - Technical debt tracker
   - Future features list

### Consolidate to Global
1. Find all RESUME_ASSETS.md across repos
2. Merge into single file: `~/.claude/PROJECT_PORTFOLIO_ASSETS.md`
3. Organize by category (AI/ML, CV, Web, etc.)
4. Add portfolio stats summary

### Remove from Repos
1. Delete RESUME_ASSETS.md and ROADMAP.md from all repos
2. Commit: "Consolidate RESUME_ASSETS.md and ROADMAP.md to global .claude folder"
3. Push to all repos

### Update Website
1. Read current `/Volumes/4tb/myWebsite/notes/pkm/use-cases.md`
2. Add/update "GitHub Projects Portfolio" section
3. List all projects with:
   - Link to GitHub repo
   - Description and tech stack
   - Key features and line counts
   - Organized by category
4. Update Table of Contents
5. Commit and push to PKM repo
6. Update website submodule reference

### Full Cycle
1. Generate RESUME_ASSETS.md for all projects
2. Consolidate to global
3. Remove from repos
4. Update website
5. Report summary

## Output
- RESUME_ASSETS.md in each project (temporary)
- Consolidated file in ~/.claude/
- Updated website with all projects
- Clean repos without RESUME_ASSETS.md
