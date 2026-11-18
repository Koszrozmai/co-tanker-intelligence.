# QA report — 17 Nov 2026
## Passed in local automated tests
- Node JavaScript syntax checks for changed modules.
- Simulated Chrome MV3 background worker: original data flow, planner generation, task completion, checklist updates, previous-format backup import, interview score/review storage.
- Browser rendering of standalone equivalent of PWA via Chromium: all existing pages navigate, 24 questions and source links, spaced repetition save, 12 academy lessons, inspection checks, port plan generation, AI prompt composer, v4 export.
- Responsive 390 px layout without page-wide horizontal scrolling.
- Static ZIP structure, manifest checks, imported scripts and PWA cache file references.

## Not tested / cannot guarantee
- Full installation through chrome://extensions in a user's Chrome profile.
- Android Samsung hardware / particular Chrome or Samsung Internet version.
- Direct automated downloads from IMO, Cyprus, Paris MoU, OCIMF, INTERTANKO etc. in actual network conditions.
- Cloud hosting, deployed Netlify Function or long-running server-side scheduling.
- Background scans while Android PWA closed; the static PWA cannot do this.
- Accuracy or completeness of legal requirements for a particular vessel.

## Regulatory caveat
- Four dated brief cards summarize authoritative primary-source pages checked on 17 Nov 2026; they are static, not live monitoring.
- No actual on-board inspection, document review or regulatory applicability is certified by this tool.
