# Review

Incomplete captures and unresolved follow-ups.

## Open

1. **Tiziran link hygiene (2026-09-10).** Three URLs advertised by tiziran.com return HTTP 404: `github.com/pirahansiah/opencv-cpp`, `tiziran.com/topics/opencv`, and `tiziran.com/topics-and-projects/opencv` (the last is also listed in the page's own site map). Could be renamed/moved/private — unknown.
2. **Tiziran partial access (2026-09-10).** Embedded Google Forms, Google Sites "Embedded Files", and CDN-hosted images were not retrievable by text extraction; long link groups were elided, so the site map may be longer than captured. Source `access_status: partial`.
3. **Tiziran PKM page is a stub (2026-09-10).** The `/book-summary/knowledge_management/pkm` page exists but carries no body text; unclear whether intentionally empty or unfinished.
4. **Untracked capture-parents cycle guard.** The vault's html/moc/ previously had a malformed `<style>` block and a missing `</main>` that were rewrote during the 2026-09-10 capture — noted here for transparency, not requiring action.

## Resolved

- **2026-09-10 — Cross-format pointer repair.** Two existing Markdown notes used `../html/notes/…` for their "View as HTML" link, which resolves to `md/html/notes/…` and was broken. Corrected to `../../html/notes/…` (generated navigation only; prose untouched): `20260909T142257825Z-introducing-hermes-agent-overview.md`, `20260909T135230683Z-dual-format-pkm-prompt.md`.
- **2026-09-10 — Index staleness regenerated.** `tags.md`/`tags.html`, `ideas.md`/`ideas.html`, `tom.md`, and `moc/inbox.*` were out of date against `catalog.json` (missing the six Hermes-agent tags, three Hermes ideas, and the hermes note from the Inbox MOC). Regenerated for consistency during the 2026-09-10 capture.

---

[Index](index.md) · [View as HTML](../html/review.html)