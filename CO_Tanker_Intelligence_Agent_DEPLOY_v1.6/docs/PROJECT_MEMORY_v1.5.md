# CO Tanker Intelligence project memory

Version: 1.5.0. Scope: chemical/product tanker Chief Officer, Europe-first and global.

Base: v1.4 desktop extension and Android PWA. Existing modules preserved: PSC/SIRE 2.0/CDI-M checklists, Academy, interview practice, port planner, notes and local public source index. Local storage key remains `coIntelligenceV1` for these modules.

New in v1.5: separate `coIntelligenceAlwaysOnV1` local storage for server-feed URL, links reviewed, cached public source and training exercise entries. This small configuration is included in v1.5 `Export backup` as `alwaysOn` and imported via v1.5 UI. No automatic cross-device account sync.

Deployable collector: `agent/collector.py`, curated `agent/sources.json` and scheduled GitHub Actions workflow `.github/workflows/collect.yml`. Outputs public `docs/data/intelligence.json`; GitHub Pages action deploys `docs` artifact in same run. No active service until repo is created/configured by the owner.

Safety boundaries: source index != verified legal obligation; auto-generated education == guided study prompts requiring primary-source review; no inspection completion without user's real verification; never upload private ship/crew/QMS content to public repo.

Next milestone: professional review workflow for full-document amendments and proposed equipment lessons, opt-in notifications, and more robust parser adapters for each public source. Validate end-to-end GitHub/Samsung deployment and restore tests before production use.
