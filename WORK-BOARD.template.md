# 🗂️ WORK-BOARD — multi-session coordination SSOT

> The single live source of truth for "who is doing what, how far, and what's left."
> Multiple AI sessions / worktrees in parallel rely on this to not collide.
>
> | This is NOT… | Go to |
> |---|---|
> | future ideas | FEATURE-BACKLOG.md |
> | known tech debt | TECH-DEBT.md |
> | one-shot handoff | docs/handoffs/* |
> | permanent facts (who you are, design intent) | agent memory |
> | **live work state (who's doing what)** | **← this file** |

**Last updated**: YYYY-MM-DD

---

## 📐 Protocol (read for 30s before you start)

**① Before starting (3 steps)**
1. Check the area map + "🔵 In progress" — confirm nobody is in your area.
2. Add a row to "🔵 In progress": area / task / branch / start / today / one-line note.
3. **Commit + push the claim immediately** (grab-the-lock) → then start.

**② While working**
- Update **your own row**'s "last updated" + note "where I am / stuck on".
- ⚠️ Edit only your own row (the board is a single file = its own merge-conflict hotspot).

**③ Done**
- Move the row to "✅ Recently done" with a commit SHA / PR link.

**④ Stale-claim recovery**
- Row not updated for ≥ 7 days = session probably died. Judge by the branch's **last-commit time** (`npm run board`), not the board edit time.
- ⚠️ Before reclaiming, re-verify on the spot: `git log -1 <branch>`. Never trust the snapshot. Only reclaim if truly no new commits; note "reclaimed from stale".

---

## 🗺️ Area map (so two sessions don't claim overlapping areas)

| Code | Scope | Main files / modules |
|---|---|---|
| **HOME** | landing page | `pages/Home.*`, hero/feature components |
| **CHECKOUT** | cart → payment | `useCheckout.*`, `orders` table, payment fn |
| **ADMIN** | back office | `pages/admin/*` |
| **CONTENT** | content / marketing pages | `content_pages`, content blocks |
| **GOV** | governance / infra | this board, agent rules, scripts |
| *(fill in for your project — aim for 5–8 areas)* | | |

> If your task spans two areas, say so in the note ("mainly LMS / also touches CONTENT") so others know.
>
> ⚠️ This area→file map is hand-drawn and drifts as the codebase grows. Re-draw it during periodic review.

---

## 🔵 In progress (claimed)

| Area | Task | Branch | Start | Last updated | Note |
|---|---|---|---|---|---|
| | | | | | |

---

## 📋 Backlog (planned, unclaimed)

> One card each: goal / current state / which files it'll touch / dependencies.
> Anyone can claim a card → move it up to "🔵 In progress".

---

## ✅ Recently done (keep ~2 weeks, then archive)

| Done | Area | Task | commit / PR |
|---|---|---|---|
| | | | |

---

## 🧭 One line for the next session

Before starting, scan "🔵 In progress" + "🗺️ Area map", confirm nobody's on your thing and you're not in someone's blast radius, then claim a card. Claim = add a row to "In progress". Done = move it to "Recently done". Before reclaiming someone's stale row, always re-verify with `git log -1 <branch>`.
