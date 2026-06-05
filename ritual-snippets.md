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

## Optional: pre-push reminder hook

If you added `scripts/board-status.mjs`, wire a **non-blocking** nudge so pushing an
unclaimed feature branch prints a reminder. Example with [husky](https://typicode.github.io/husky/):

```sh
# .husky/pre-push
# ... your existing checks ...

# Board nudge (never blocks): pushing a feature branch the board doesn't list → remind
node scripts/board-status.mjs --hook || true
```

> ⚠️ If you have other gating checks in the same hook, make sure they run with
> `|| exit 1` **before** this line — otherwise this always-exit-0 line swallows their
> exit code and silently disables the gate. (Learned the hard way.)
