# CMS — Keystatic

See README.md section **CMS (Keystatic)** for the full how-to.

## Quick start

1. `cd /workspace/bb-website`
2. `npm run dev`
3. Open http://127.0.0.1:4321/keystatic

## Collections

| Collection | Path | Admin label |
|---|---|---|
| Business models | `src/content/models/*` | Business models |
| Articles & guides | `src/content/articles/*` | Articles & guides |

Schema: `src/content.config.ts` + `keystatic.config.ts`.

Agents edit `.md` files on disk; slug = filename.

## Tags & doors

**Tags** (shared string vocabulary across both collections). Examples:

`buy`, `grow`, `ownership`, `franchise`, `systems`, `capital`, `operator`

**Doors** (optional multiselect): `buy` | `grow` — features the entry on `/buy` and/or `/grow` (up to 3 cards each).
