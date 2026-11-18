# Security, Privacy and Scope

- Data (tasks, vessel field, training results, inspector notes) are saved in local Chrome extension storage or browser localStorage on Samsung, depending on version. No app-managed remote sync.
- External URLs open original references in a browser tab. AI prompt is copied only when user clicks; neither ChatGPT nor Gemini receives ship/private notes automatically.
- Before pasting a question into any external AI, remove confidential ship, crew, company, voyage or customer details.
- PWA static hosting does not include always-on background monitoring or push notification scheduler; the Netlify relay is optional and needs deployment from Git/CLI.
- The app cannot certify equipment condition, certificate validity or statutory compliance. Verify against primary legal texts and the approved vessel SMS/QMS, P&A Manual, CoF, SDS and equipment instructions.
