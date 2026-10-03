# Skills - on-demand workflows

Loaded by description match, not kept in context. Keep each one short enough to load whole.
`effort:` frontmatter overrides the session effort while the skill runs.

| Skill | Use when |
|---|---|
| `full-pipeline` | Running the whole capture -> deploy chain |
| `collect-and-label` | Building or extending a dataset |
| `cv-pipeline` | Designing a detection/tracking/segmentation pipeline |
| `benchmark-model` | Measuring latency, throughput, size, accuracy |
| `quantize` | Quantizing a model to INT8/INT4 |
| `debug-quantization` | Quantized model lost accuracy or was rejected |
| `edge-deploy` | Compiling for a specific accelerator |
| `platform-porting` | Moving code between macOS, Linux and Windows |
| `handoff` | Freezing the session into a handoff document |
| `explain-output` | Turning a result into text, a diagram, a page or a video |

Dropped from the old sets (kept only where they already live): `graphify` (58 KB vendored tool,
still in `myWebsite/.claude/skills/graphify`), `humanizer`/`unslop` (belongs to Hermes skills),
`teach`, `grill-*`, `tdd`, `to-prd`, `to-issues`, `triage`, `prototype` (engineering-process skills,
duplicated by the Hermes skill library and not vision-specific).
