# brianbeers.com — site shell

Production shell for brianbeers.com: Astro + Tailwind + MDX content collections + Keystatic CMS.

Light cream theme (#FAFAF8 / near-black #171717 / yellow CTAs #FBA91A and #FBBD23). No navy chrome.

## Stack

- Astro 5 — static pages + Content Layer collections
- Tailwind CSS 3 — via @astrojs/tailwind
- MDX — via @astrojs/mdx
- Keystatic — local markdown CMS at /keystatic (dev only)
- Sample models in src/content/models/ (handyman, residential plumbing, roofing, used clothing resale only — CoS library not imported yet)
- Sample articles/guides in src/content/articles/

## Run locally

Prefer:

    cd /workspace/bb-website
    npm install
    npm run dev

Or:

    npm run build && npm run preview

Dev/preview bind to http://0.0.0.0:4321

## CMS (Keystatic)

Brian can edit **models** and **articles/guides** in a local admin UI; agents can still write/edit `.md` files on disk under `src/content/models/` and `src/content/articles/`.

### Open the editor

1. From this repo: npm run dev
2. In the browser: http://127.0.0.1:4321/keystatic
   (or http://0.0.0.0:4321/keystatic / whatever host you use)

Keystatic runs in local storage mode — saves write straight to markdown files in the repo. No cloud login required for local editing.

In the admin sidebar you will see:

- **Business models** → `src/content/models/*`
- **Articles & guides** → `src/content/articles/*`

The Keystatic integration is enabled for astro dev (and when KEYSTATIC=1). It is not bundled into npm run build, so production stays a static site.

### Content shape

**Models** frontmatter follows /workspace/content-plan/business-models/SCHEMA.md:

- Required: title, slug, description, category, status, publish, readMinutes
- Optional: tags, doors, buyerTypes, relatedSlugs, sources, cta, updated
- Categories include education and real-estate-ops (full enum in schema)

**Articles & guides**:

- Required: title, description, publish, status, readMinutes, kind (`article` | `guide`)
- Optional: tags, doors (`buy` | `grow`), updated, slug
- Body: markdown content

Astro collections: `src/content.config.ts`
Keystatic config: `keystatic.config.ts` (same fields; body stored as `.md`)

### Tags & doors (shared convention)

Use the same **tags** vocabulary on models and articles so content can be filtered/featured together. Examples:

- `buy`, `grow`, `ownership`, `franchise`, `systems`, `capital`, `operator`

**Doors** is a separate optional field (`buy` and/or `grow`). Entries with `doors` including `buy` appear in the featured strip on `/buy` (up to 3 cards); same for `/grow`. Prefer doors for path-page featuring; use tags for topical vocabulary.

### Agents / git workflow

- Edit or add `src/content/models/*.md` and `src/content/articles/*.md` directly — no CMS required
- Keep slug matching the filename (without .md)
- Do not import the full CoS library from /workspace/content-plan/business-models until publish hold is lifted

## Routes (shell)

- / — James Clear-style hero + lead magnet + Hi Brian + Buy/Grow doors
- `/buy` — Buy journey + featured models/articles (doors: buy)
- `/grow` — Owner vs operator + freedom design + featured (doors: grow)
- /about — Hi Brian story + photo
- /contact — Live Formsubmit email; supports ?intent=guide&email= prefill (see docs/contact-form-setup.md)
- /franchises — SEO hub nested under Buy
- /models — Index of existing sample models only
- `/models/[slug]` — Model detail from content collection
- `/articles` — Index of published articles & guides
- `/articles/[slug]` — Article/guide detail
- `/keystatic` — CMS admin (dev server only)

## Design notes

- Soft ownership CTAs only — no FTC earnings promises
- Token navy in Tailwind = near-black ink #171717 (not a navy header/chrome)
- CoS model library under /workspace/content-plan/business-models stays on publish hold — do not import yet
