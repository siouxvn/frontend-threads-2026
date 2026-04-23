# Docs Authoring Rules

Applies to any work touching `docs/` — markdown articles, thread index pages, and demo `.tsx` files under `docs/<section>/demos/`.

## Rules (MANDATORY)

1. **MUST activate the `sf-dumi-docs` skill.** Before writing or editing anything under `docs/`, invoke `/sf-dumi-docs` (or let it auto-trigger). Do not freestyle Dumi syntax, frontmatter, or thread/demo structure — always consult the skill for project conventions.

2. **MUST write docs content in English.** This includes:

   - All markdown prose and headings
   - Frontmatter `title` / `description` / `nav` / `group` fields
   - Code comments inside demo `.tsx` files
   - Thread index entries and link labels

   Write in English regardless of the language the user uses to request the work. If the user provides source material (quotes, logs, notes) in another language, translate to English before embedding.

   **Exception:** Verbatim user quotes from transcripts may be preserved in their original language only when the article is explicitly documenting that conversation (e.g. `docs/ai-threads/`), and must be clearly marked as a quote.

3. **No exceptions without explicit user override.** If the user explicitly requests non-English docs for a specific file, honor that request for that file only — do not generalize to other files.
