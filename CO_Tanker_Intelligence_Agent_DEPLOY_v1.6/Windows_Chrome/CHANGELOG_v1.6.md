# CO Tanker Intelligence 1.6 · 18 November 2026

- Published the owner-private Watch with an independent research schedule and durable record storage. Each run records attempted sources, failures, corrections and publication links. Retried writes reuse a run ID and overlapping jobs merge their updates.
- Added a Watch summary on the overview, since-last-visit and review filters, saved articles, original-source quizzes, local answers and study links. A revised item returns to the unread list with a revision history.
- Publication date, publisher revision, event period and original check now have separate fields. Pending regulatory interpretation and high-risk suggestions retain a review label.
- Fixed same-origin authentication for the private PWA feed. Cached research remains visible during feed failures. The PWA service worker only manages its own cache family and application shell.
- The portable edition includes ten research items as a dated reference, with nine source-based quizzes. The restricted INTERTANKO item is a listing.
- The optional GitHub collector now handles RSS dates, publication versus update dates in Atom, Cyprus circular table rows, conditional fetches, retries after source errors and revisions. It validates existing feed data before replacing the file.
- Existing inspection, planner, training and backup modules remain available. Watch backup v5 adds the cached feed, saved items and quiz responses. Earlier v1.5 backup data can be imported.
