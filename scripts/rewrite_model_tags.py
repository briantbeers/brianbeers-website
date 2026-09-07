#!/usr/bin/env python3
"""Rewrite model frontmatter tags to a tight business-type whitelist."""
from __future__ import annotations

import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODELS = ROOT / "src/content/models"

ALLOWED = [
    "recurring-revenue",
    "easy-entry",
    "seasonal",
    "high-ticket",
    "project-based",
    "route-based",
    "insurance-driven",
    "emergency",
    "membership",
    "b2b",
]
ALLOWED_SET = set(ALLOWED)

# synonym (lowercase) -> whitelist tag
SYNONYMS: dict[str, str] = {
    # recurring-revenue
    "recurring-revenue": "recurring-revenue",
    "recurring": "recurring-revenue",
    "recurring-routes": "recurring-revenue",  # also route-based via separate rule
    "recurring-contracts": "recurring-revenue",
    "recurring-fees": "recurring-revenue",
    "recurring-tuition": "recurring-revenue",
    "recurring-vs-project": "recurring-revenue",
    "mrr": "recurring-revenue",
    "rmr": "recurring-revenue",
    "sticky-revenue": "recurring-revenue",
    "residuals": "recurring-revenue",
    "retainers": "recurring-revenue",
    "one-time-vs-recurring": "recurring-revenue",
    "subscription-retention": "recurring-revenue",
    "managed-services": "recurring-revenue",
    # membership
    "membership": "membership",
    "memberships": "membership",
    "member-co-op": "membership",
    # easy-entry
    "easy-entry": "easy-entry",
    "low-capex": "easy-entry",
    # seasonal
    "seasonal": "seasonal",
    "seasonality": "seasonal",
    "seasonal-calendar": "seasonal",
    "seasonal-spikes": "seasonal",
    "seasonal-skus": "seasonal",
    "seasonal-coatings": "seasonal",
    "costume-season": "seasonal",
    "storm": "seasonal",
    "storm-cycle": "seasonal",
    # high-ticket
    "high-ticket": "high-ticket",
    # project-based
    "project-based": "project-based",
    "project-sales": "project-based",
    "project-install": "project-based",
    "project-mix": "project-based",
    "project-management": "project-based",
    # route-based
    "route-based": "route-based",
    "route-density": "route-based",
    "route-business": "route-based",
    "routes": "route-based",
    "restock-routes": "route-based",
    "chemical-routes": "route-based",
    # insurance-driven
    "insurance-driven": "insurance-driven",
    "insurance": "insurance-driven",
    "insurance-channel": "insurance-driven",
    "insurance-claims": "insurance-driven",
    "insurance-heavy": "insurance-driven",
    "insurance-billing": "insurance-driven",
    "insurance-dispute": "insurance-driven",
    "claim-cycle": "insurance-driven",
    # emergency
    "emergency": "emergency",
    "emergency-calls": "emergency",
    "emergency-dispatch": "emergency",
    # note: do NOT map bare 24-7 / 24-hr / on-call — only emergency-shaped tags
    # b2b
    "b2b": "b2b",
    "b2b-contracts": "b2b",
    "b2b-accounts": "b2b",
    "b2b-fleets": "b2b",
    "commercial": "b2b",
}

# If recurring-routes present, map to BOTH recurring-revenue and route-based
DUAL_MAP = {
    "recurring-routes": ["recurring-revenue", "route-based"],
}


def normalize_tags(raw: list[str]) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    for t in raw:
        key = t.strip().lower()
        if not key:
            continue
        if key in DUAL_MAP:
            mapped_list = DUAL_MAP[key]
        elif key in SYNONYMS:
            mapped_list = [SYNONYMS[key]]
        elif key in ALLOWED_SET:
            mapped_list = [key]
        else:
            continue
        for m in mapped_list:
            if m in ALLOWED_SET and m not in seen:
                seen.add(m)
                out.append(m)
    # stable preferred order
    return [t for t in ALLOWED if t in seen]


def rewrite_file(path: Path) -> tuple[list[str], list[str]]:
    text = path.read_text(encoding="utf-8")
    m = re.match(r"^---\n(.*?)\n---\n?(.*)$", text, re.S)
    if not m:
        return [], []
    fm, body = m.group(1), m.group(2)
    tags_m = re.search(r"^tags:\n((?:- .*\n)*)", fm, re.M)
    if tags_m:
        old_block = tags_m.group(0)
        old_tags = re.findall(r"^- (.+)$", tags_m.group(1), re.M)
    else:
        # no tags key
        old_tags = []
        old_block = None

    new_tags = normalize_tags(old_tags)

    if old_block is not None:
        if new_tags:
            new_block = "tags:\n" + "".join(f"- {t}\n" for t in new_tags)
        else:
            new_block = "tags: []\n"
        fm2 = fm[: tags_m.start()] + new_block + fm[tags_m.end() :]
    else:
        # leave files without tags alone (don't invent)
        fm2 = fm
        new_tags = []

    if fm2 != fm:
        path.write_text(f"---\n{fm2}\n---\n{body}", encoding="utf-8")
    return old_tags, new_tags


def main() -> None:
    before: Counter[str] = Counter()
    after: Counter[str] = Counter()
    files_changed = 0
    for path in sorted(MODELS.glob("*.md")):
        old, new = rewrite_file(path)
        before.update(t.strip().lower() for t in old)
        after.update(new)
        if old or new:
            # count change when tags key existed
            if normalize_tags(old) != new or (old and normalize_tags(old) == new and set(x.strip().lower() for x in old) != set(new)):
                files_changed += 1
            elif old != new:
                files_changed += 1

    # recount changed more accurately
    files_changed = 0
    for path in sorted(MODELS.glob("*.md")):
        text = path.read_text(encoding="utf-8")
        # already rewritten; just stats
        pass

    print("BEFORE unique tags:", len(before))
    print("AFTER unique tags:", len(after))
    print("AFTER tag counts:", dict(after))
    print("Allowed remaining non-whitelist in after:", sorted(set(after) - ALLOWED_SET))


if __name__ == "__main__":
    main()
