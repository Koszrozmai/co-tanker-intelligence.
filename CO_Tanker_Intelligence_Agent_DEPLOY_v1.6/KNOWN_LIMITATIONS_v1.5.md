# Known limitations and safety boundaries

1. Static packages cannot fetch 24/7 when computers are off. Deploy and maintain GitHub Actions (or another scheduler).
2. Scheduled GitHub Actions is best-effort, not a guaranteed service. Some listed sources block automated access or change HTML; they show failures rather than empty success.
3. Collector detects article **links and listing titles**, not authenticated full-text law. Its `status_label` is never a legal status determination.
4. Guided study prompts are not professionally reviewed training modules; no new mandatory inspection checklist items are automatically added.
5. The Chrome extension requires permission for the user-selected HTTPS feed host, requested on the Save & Connect click.
6. Feed JSON is public (and GitHub Pages commonly public). Never put private ship data in the repository.
7. Individual local Chrome/PWA storage remains unsynchronized, but supports user-initiated export/import. Separate Watch state is included in backups created with v1.5.
8. Browser and network access differ across devices. Not tested on a real Samsung handset.
