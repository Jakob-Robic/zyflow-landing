# Legal source (rebuild)

Markdown in this folder is compiled into `/legal-pages/*` by `rebuild/scripts/build.js`.

This folder is **not** the Legal bot reviewer bundle. The attached Legal bot `README.md` (sections after “Rules for the developer bots”) was not present in the agent environment and must not be published.

Rules applied at build time:

- HTML comments are stripped from published HTML
- `[PLACEHOLDER]` / `[VERIFY]` spans are kept verbatim and wrapped in `<mark class="placeholder">`
- On account-deletion pages, the heading **Use after code fix ships** and everything under it is dropped
