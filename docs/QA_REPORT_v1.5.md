# CO Tanker Intelligence v1.5 — QA report

Date: 2026-11-18

## Passed tests
- Static validity of all Chrome/PWA JavaScript modules with Node `--check`.
- Root `manifest.json` included in desktop extension and `manifest.webmanifest` in Samsung PWA.
- Python `unittest` (4 scenarios): trusted-domain filtering, HTML article extraction, no invented effective date, deduplication across consecutive runs.
- Isolated headless Chromium test with synthetic feed: `Always-On Watch` displayed article links, training prompts, per-source failure and freshness text; zero JavaScript runtime exceptions. Simulated mobile width: 390 px.
- Inspector/Academy/Planner source modules remain present and unchanged except import of Watch UI and portable backup field. This is **not** a full regression test of all functions.
- JSON parse validation for feed and updated manifests; Python `compileall` collector.

## Not verified
- Actual scheduled execution in a GitHub repository: **not deployed**; package contains setup and workflow.
- Third-party live fetch from every approved source (environment network limitations). Some sources may return 403 or change page markup.
- End-to-end Chromium extension loading through `chrome://extensions` (browser administrator blocks local navigation in this environment).
- Real Samsung device, offline storage persistence and battery-state behavior.
- Authenticated or paid documents, PDF amendments or verified binding legal interpretations.

## Safety
- Reports must display source failures rather than pretend no updates were found.
- New dynamically generated material is a *guided reading exercise*, not a verified operational procedure, legal advice, official vetting question or inspector checklist.
- Offline app remains usable with a clear stale / not deployed status for autonomous news feed.
