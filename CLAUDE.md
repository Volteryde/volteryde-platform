# Volteryde Platform — Claude Instructions

## Security (Always On)

- Always run snyk_code_scan tool for new first-party code generated in a Snyk-supported language.
- If any security issues are found based on newly introduced or modified code or dependencies, attempt to fix them using the Snyk results context.
- Rescan after fixing to ensure issues are resolved and no new ones introduced.
- Repeat until no new issues are found.
