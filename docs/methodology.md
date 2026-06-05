# 🗂️ WORK-BOARD methodology (full guide)

> This is a **methodology guide**, not any one project's board. It explains how to keep parallel AI coding sessions (or worktrees, or teammates) from colliding using a single plain-text file — and how to set one up in your own repo.
>
> Audience: anyone coding with AI agents (Claude Code / Cursor / others) who **often runs several chat windows / git worktrees / branches against the same repo at once.**

---

## 1. What problem it solves

When you code with AI, you naturally open **several chat windows at once**: A refactors checkout, B edits the admin page, C writes docs. Every AI session is *amnesiac* — it only knows its own conversation and has **no idea which files the other windows are touching.** So:

| Disaster | Why |
|---|---|
| Two sessions edit the same file → merge conflict / overwrite | Nobody knew the other was there |
| Duplicated work | A finished it; B didn't know and did it again |
| Changed X, unaware Y relied on X's old behavior | No "blast radius" awareness |
| The next session starts from zero | Last session's progress lives nowhere fixed |
| Deleted a branch someone was still using | Judged "abandoned" from memory / a stale snapshot |

**The board is a sticky note on the wall**: who's doing what, how far, which files. Glance before you start — you stop colliding with yourself.

> Core idea: **turn "who's doing what" into one plain-text SSOT (single source of truth) that every session can see and actively maintains.**

### When you *don't* need it (the boundary)

It has a maintenance cost. Skip it if you only ever run **one** window and work linearly, or it's a tiny solo project you hold in your head. Adopt it when you start running **2+ windows / worktrees on the same repo in parallel**, or have ever hit "we both edited the same file" / "we both did the same thing."

---

## 2. What it is NOT — the file split (the most important section)

The #1 failure is mixing the board with everything else until it rots into an unmaintained dump. Keep these 5 docs strictly separate:

| Doc | Holds | Trait |
|---|---|---|
| **WORK-BOARD** (this) | live work state: who's doing what, how far | changes constantly, goes stale in days |
| FEATURE-BACKLOG | future ideas you won't build yet | slow accretion |
| TECH-DEBT | known debt not yet paid | slow accretion |
| handoff | one-shot "pass to next session" note | use-once |
| agent memory | permanent facts (who you are, design intent, scars) | rarely changes, auto-loaded |

### Why progress must NOT go in agent memory (counterintuitive but key)

1. **Memory auto-loads every session** → putting live progress there bloats context with fast-expiring noise and is quickly wrong.
2. **Memory is for permanent facts** → "task 60% done" is false in three days; it shouldn't sit next to "design intent."

Split: **memory** holds what never changes; the **board** holds what does — a plain-text file where whoever edits owns it.

---

## 3. The board's structure (copy these blocks)

A board is one Markdown file containing:

1. **Header + split table** — state up front "this is the single live source," with a "what this is NOT, go here instead" table.
2. **Canonical access path** — the one fixed path, how to edit, how to sync. All sessions read/write **the same file at the same path**, ideally on the main branch.
3. **Protocol** — the soul of the board (section 4).
4. **Area map** — split the project into areas, each with its main files. Claiming, you instantly see if someone's already there and whose turf you'll touch.
5. **🔵 In progress** — a table, one row per active task. The core.
6. **📋 Backlog** — planned-but-unclaimed cards, ready to claim.
7. **✅ Recently done** — finished rows move here with a commit/PR; keep ~2 weeks then archive.
8. **One line for the next session** — a closing summary of the SOP.

---

## 4. The protocol (copy verbatim)

**① Before starting (3 steps)**
1. Check the **area map** + **In progress** — confirm nobody is in your area.
2. **Add a row** to "In progress": area / task / branch / start / today / one-line note.
3. **Commit + push that claim immediately** (not when you finish) → then start.

> **Why push the claim right away (the grab-the-lock rule):** between "check nobody's there" and "add a row" there's a gap — two sessions can both read *empty* and claim the same area (a race). Pushing the row instantly uses git as the lock: whoever pushes first wins; the second push fails and must rebase, discovering the collision **at claim time**, not at merge time.

**② While working**
- On each meaningful step, update **your own row**'s "last updated" + note "where I am / stuck on".
- ⚠️ **Edit only your own row.** The board is a single file everyone writes to → it's its own merge-conflict hotspot.

**③ Done**
- Move the row to "✅ Recently done" with a commit SHA / PR link.

**④ Stale-claim recovery**
- A row not updated for ≥ N days (default 7) = that session probably died.
- Judge staleness by the **branch's last-commit time**, not the board edit time (the status script flags `⚠stale`).
- ⚠️ **Before reclaiming, re-verify on the spot: `git log -1 <branch>`.** Never trust the snapshot, or you'll delete an active branch. Only reclaim if there are truly no new commits; note "reclaimed from stale."

**⑤ Auto-nudge (non-blocking)**
- A pre-push hook runs `board-status.mjs --hook`: pushing a feature branch not on the board prints one reminder line. Reminder only — never blocks.

---

## 5. Making the AI actually use it (wire it into the opening ritual)

A file alone does nothing — an AI session won't think to look. **Write "scan the board before starting" into the agent's always-loaded rules** so it reads it on every new conversation.

Claude Code (`CLAUDE.md`):

```markdown
## Opening ritual (first thing every new conversation)
Before any cross-file / feature task, scan WORK-BOARD.md's "In progress" + "Area map":
confirm no other session is on the same area and you're not in someone's branch blast radius.
Claiming = add a row to "In progress". Read-only Q&A can skip this.
```

> Same for Cursor's `.cursorrules` or any agent's rules file. **No opening ritual = the board is dead.** Snippets: `ritual-snippets.md`.

---

## 6. A full walkthrough (three windows, one day)

You have three AI windows A / B / C open at once.

**09:00 — A starts a checkout refactor.** A scans the board: CHECKOUT area, In progress empty → nobody's there. A adds a row `CHECKOUT｜refactor checkout｜feat/checkout｜…`, **commits + pushes immediately** (grab the lock), starts.

**09:30 — B wants the admin page.** B scans: B's touching ADMIN, sees only A on CHECKOUT → no overlap ✅. B adds a row, pushes, starts. Key: B instantly knows "don't touch `useCheckout`, `orders` table" because the map marks that as CHECKOUT turf and A is there.

**11:00 — C also wants checkout's discount display.** C scans, sees A already on CHECKOUT, note "refactoring" → doesn't barge in. Picks other work / waits / coordinates. **Collision avoided before editing, not at the merge of two PRs.**

**16:00 — A finishes.** A moves the row to "✅ Recently done" with a SHA. C sees CHECKOUT free up and can take it.

**Next week — a zombie claim.** A row hasn't updated in 9 days. First run the status script to check that branch's last-commit time; if it's also 9 days quiet = probably abandoned. ⚠️ Before reclaiming, `git log -1` once more on the spot; only collect it if there are truly no new commits, noting "reclaimed from stale."

> No lock, no enforcement — just the habit "glance before you start, claim before you act." Because it's wired into the opening ritual, every window does it automatically.

---

## 7. Rollout steps

1. **Create the file** at a fixed path on the main branch (`WORK-BOARD.md`).
2. **Copy the 8 blocks** (or use `WORK-BOARD.template.md`).
3. **Draw your own area map** — 5–8 areas, each with main files. The one step worth real thought; pays off long-term.
4. **Wire the opening ritual** into `CLAUDE.md` / `.cursorrules`.
5. **Demo once** — walk a task through claim → update → done yourself.
6. **Agree on the stale window** (default 7 days), write it into the protocol.
7. **Ship the MVP first** — small project? Just the "In progress" table + opening ritual. Grow the area map, backlog cards, and status script only once collisions actually start. **Over-engineering makes people stop maintaining it — which kills it.**

> ⚠️ **CI / auto-deploy cost:** if the board lives on your production branch and CI builds on **every** push, then every claim = a push = a build — a plain-text change still burns build minutes (e.g. Netlify's free cap). Fix with `[skip ci]` in the board commit, or a path filter so only real frontend changes build (Netlify: `ignore = "git diff --quiet $CACHED_COMMIT_REF $COMMIT_REF -- ."`). Sort this out before adopting.

---

## 8. Common pitfalls

| Pitfall | Why it's wrong | Fix |
|---|---|---|
| Progress in AI memory | auto-loads, bloats context, goes stale | progress on the board, memory for permanent facts only |
| Board on a feature branch | per-branch boards fork; truth splinters | fixed path on the main branch, one file for all |
| Claim then don't update | others can't tell if you're still on it | update "last updated" on each step |
| Everyone re-sorts the whole table | the board becomes its own merge-conflict hotspot | edit only your own row |
| Delete a branch off the old snapshot | snapshot may be stale → you kill an active branch | re-verify with `git log -1` before reclaiming |
| Board commit triggers full CI build | plain-text change burns deploy quota | `[skip ci]` or a CI path filter |
| Dump everything on the board | becomes an unmaintained mess | enforce the 5-doc split (section 2) |
| Built it but no opening ritual | nobody / no AI remembers to look | wire it into the rules file |

---

## 9. One-line summary

> **WORK-BOARD is a plain-text noticeboard every developer (including each amnesiac AI session) reads before starting and claims a slot on before acting.**
> It holds only one kind of thing — "who's doing what, how far, right now"; everything else has its own home.
> Its value isn't the file; it's the three disciplines actually being followed: **wired into the opening ritual + claim before acting + re-verify before reclaiming.**
