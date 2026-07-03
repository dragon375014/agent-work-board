# Opening-ritual snippets

The board is **dead unless your agent is told to read it**. Paste the matching snippet into your tool's always-loaded rules file. Pick the one for your tool.

> Why this matters: an AI session won't think to look at the board on its own. The opening ritual is what makes "scan before you start, claim before you act" happen automatically on every new conversation.

---

## Claude Code — `CLAUDE.md`

```markdown
## Opening ritual (first thing every new conversation)

Before any cross-file / feature task, scan WORK-BOARD.md's
"🔵 In progress" + "🗺️ Area map":
confirm no other session is on the same area and you're not inside
someone's branch blast radius. Claiming = add a row to "In progress".
Pure Q&A / read-only lookups can skip this.
```

---

## Cursor — `.cursorrules`

```
Before starting any cross-file or feature change, read WORK-BOARD.md
(the "In progress" table and "Area map"). Do not edit files in an area
another session has claimed. To start work, add a row claiming it, then
commit+push that claim before editing. Read-only questions can skip this.
```

---

## Generic agent (system prompt / rules file)

```
This repo uses WORK-BOARD.md as the single live source of truth for
who is working on what. Before modifying any code:
1. Read WORK-BOARD.md "In progress" + "Area map".
2. If your target area is claimed by another session, do not proceed —
   pick something else or coordinate.
3. To claim: add a row (area / task / branch / dates / note) and
   commit+push it immediately, before you start editing.
4. Keep only your own row updated. Move it to "Recently done" when finished.
```

---

## Optional: pre-push claim gate hook

If you added `scripts/board-status.mjs`, wire it as your pre-push hook so the
claim gate can actually fire. Example with [husky](https://typicode.github.io/husky/):

```sh
# .husky/pre-push
# ... your existing checks ...

# Board claim gate (conditional — see README §⑤ "Claim gate"): solo = one
# reminder line, never blocks; parallel = blocks (exit 1) until you claim.
# Let its exit code propagate — do not swallow it.
node scripts/board-status.mjs --hook
```

> ⚠️ Do **not** append `|| true` to this line. The gate's whole point is that
> it exits 1 when another session is active and your branch is unclaimed —
> `|| true` silently swallows that exit code and the gate never blocks, no
> matter how many sessions are running. If you have *other* gating checks in
> the same hook, put them **before** this line with their own `|| exit 1`, so
> one script's always-exit-0 pattern can't mask another's failure.
