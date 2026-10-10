# Legal source (rebuild)

Markdown in this folder is compiled into `/legal-pages/*` by `rebuild/scripts/build.js`.

These files are the Legal-bot source texts. Keep them as plain markdown so later replacements can be swapped in. Do not publish reviewer notes from any bundle README after “Rules for the developer bots”.

Rules applied at build time:

- HTML comments are stripped from published HTML
- On account-deletion pages, the heading **Use after code fix ships** and everything under it is dropped if present
