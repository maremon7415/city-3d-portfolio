# Floating Island City v2 — redesign docs

Start with **[PLAN.md](PLAN.md)**. It's the final plan, written after a multi-agent review: 3 independent proposals, 3 judges, and a critic pass.

1. Answer the 10 open questions at the end of PLAN.md. Any question you skip falls back to its default (see the table in §8).
2. Work through the phases P0 → P5 in order. Each phase has a "done when" checklist.

PLAN.md mentions per-phase Vercel previews and a `v2` branch. Both are optional if you work locally.

`analysis/` holds the supporting research:

| File | Contents |
|---|---|
| `content.md` | All real content pulled from the portfolio3 repo: projects, metrics, experience, services, stack, contact flow and assets |
| `design-language.md` | portfolio3's brand: colours, fonts and motion, and how each translates to 3D. Includes the font conversion notes for troika SDF text |
| `overlay-audit.md` | What's wrong with the current HTML cards and camera, measured at 5 viewports |
| `3d-presentation-research.md` | Techniques for showing content inside the 3D scene with R3F and drei |
| `proposal-*.md` | The 3 competing proposals the plan was synthesised from |

Paths written as `<analysis-sandbox>/…` point to scratch files from the analysis run, which aren't in this repo.
